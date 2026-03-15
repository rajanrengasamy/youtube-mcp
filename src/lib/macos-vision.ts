import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { execa } from "execa";

export interface NativeFrameAnalysis {
  framePath: string;
  width?: number;
  height?: number;
  ocrText?: string;
  ocrConfidence?: number;
  featureVector?: number[];
}

interface SwiftAnalysisPayload {
  path: string;
  width?: number;
  height?: number;
  ocrText?: string;
  ocrConfidence?: number;
  featureVector?: number[];
  error?: string;
}

interface SwiftResponsePayload {
  results: SwiftAnalysisPayload[];
}

const SCRIPT_VERSION = "2026-03-15-v1";

export class MacOSVisionAnalyzer {
  constructor(private readonly swiftBinary = "swift") {}

  async analyzeFrames(framePaths: string[]): Promise<NativeFrameAnalysis[]> {
    const uniquePaths = Array.from(new Set(framePaths.filter((path) => typeof path === "string" && path.trim().length > 0)));
    if (uniquePaths.length === 0) return [];

    const missing = uniquePaths.filter((path) => !existsSync(path));
    if (missing.length > 0) {
      throw new Error(`Frame file does not exist: ${missing[0]}`);
    }

    const scriptPath = ensureSwiftScript();
    const payloadPath = join(tmpdir(), `vidlens-macos-vision-${randomUUID()}.json`);
    writeFileSync(payloadPath, JSON.stringify({ images: uniquePaths }), "utf8");

    try {
      const { stdout } = await execa(this.swiftBinary, [scriptPath, payloadPath], {
        timeout: Math.max(60_000, uniquePaths.length * 20_000),
      });
      const parsed = JSON.parse(stdout) as SwiftResponsePayload;
      return (parsed.results ?? []).map((item) => {
        if (item.error) {
          throw new Error(`Apple Vision failed for ${item.path}: ${item.error}`);
        }
        return {
          framePath: item.path,
          width: item.width,
          height: item.height,
          ocrText: normalizeOptionalText(item.ocrText),
          ocrConfidence: item.ocrConfidence,
          featureVector: normalizeVector(item.featureVector),
        } satisfies NativeFrameAnalysis;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Apple Vision analysis failed. Ensure macOS Swift + Vision framework are available. ${message}`);
    } finally {
      try {
        unlinkSync(payloadPath);
      } catch {
        // best-effort temp cleanup
      }
    }
  }

  async probe(): Promise<{ backend: string; swiftVersion: string }> {
    const scriptPath = ensureSwiftScript();
    const [{ stdout: probeStdout }, { stdout: swiftStdout }] = await Promise.all([
      execa(this.swiftBinary, [scriptPath, "--probe"], { timeout: 30_000 }),
      execa(this.swiftBinary, ["--version"], { timeout: 30_000 }),
    ]);
    const probe = JSON.parse(probeStdout) as { backend?: string };
    return {
      backend: probe.backend ?? "apple_vision",
      swiftVersion: swiftStdout.split("\n")[0] ?? "swift",
    };
  }
}

function ensureSwiftScript(): string {
  const scriptPath = join(tmpdir(), `vidlens-macos-vision-${SCRIPT_VERSION}.swift`);
  if (!existsSync(scriptPath)) {
    writeFileSync(scriptPath, SWIFT_SCRIPT, "utf8");
  }
  return scriptPath;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeVector(values: number[] | undefined): number[] | undefined {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }
  const finite = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return undefined;
  }
  const magnitude = Math.sqrt(finite.reduce((sum, value) => sum + (value * value), 0));
  if (!Number.isFinite(magnitude) || magnitude <= 1e-9) {
    return finite;
  }
  return finite.map((value) => value / magnitude);
}

const SWIFT_SCRIPT = String.raw`
import Foundation
import Vision
import AppKit

struct RequestPayload: Codable {
  let images: [String]
}

struct ResultPayload: Codable {
  let path: String
  let width: Int?
  let height: Int?
  let ocrText: String?
  let ocrConfidence: Double?
  let featureVector: [Float]?
  let error: String?
}

struct ResponsePayload: Codable {
  let results: [ResultPayload]
}

struct ProbePayload: Codable {
  let backend: String
}

func emitJSON<T: Encodable>(_ value: T) {
  let encoder = JSONEncoder()
  if let data = try? encoder.encode(value), let text = String(data: data, encoding: .utf8) {
    print(text)
  } else {
    fputs("{\"error\":\"json_encode_failed\"}\n", stderr)
    exit(1)
  }
}

func loadCGImage(path: String) throws -> CGImage {
  guard let image = NSImage(contentsOfFile: path) else {
    throw NSError(domain: "VidLensVision", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not open image at \(path)"])
  }
  var rect = CGRect(origin: .zero, size: image.size)
  guard let cgImage = image.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
    throw NSError(domain: "VidLensVision", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not read CGImage for \(path)"])
  }
  return cgImage
}

func analyze(path: String) -> ResultPayload {
  do {
    let cgImage = try loadCGImage(path: path)
    let textRequest = VNRecognizeTextRequest()
    textRequest.recognitionLevel = .accurate
    textRequest.usesLanguageCorrection = true

    let featureRequest = VNGenerateImageFeaturePrintRequest()

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([textRequest, featureRequest])

    let observations = (textRequest.results as? [VNRecognizedTextObservation]) ?? []
    var recognizedLines: [String] = []
    var totalConfidence = 0.0
    var confidenceCount = 0

    for observation in observations {
      if let candidate = observation.topCandidates(1).first {
        recognizedLines.append(candidate.string)
        totalConfidence += Double(candidate.confidence)
        confidenceCount += 1
      }
    }

    var featureVector: [Float]? = nil
    if let featurePrint = featureRequest.results?.first as? VNFeaturePrintObservation {
      var values = Array<Float>(repeating: 0, count: featurePrint.elementCount)
      values.withUnsafeMutableBytes { rawBuffer in
        featurePrint.data.copyBytes(to: rawBuffer)
      }
      featureVector = values
    }

    return ResultPayload(
      path: path,
      width: cgImage.width,
      height: cgImage.height,
      ocrText: recognizedLines.isEmpty ? nil : recognizedLines.joined(separator: "\n"),
      ocrConfidence: confidenceCount > 0 ? totalConfidence / Double(confidenceCount) : nil,
      featureVector: featureVector,
      error: nil
    )
  } catch {
    return ResultPayload(
      path: path,
      width: nil,
      height: nil,
      ocrText: nil,
      ocrConfidence: nil,
      featureVector: nil,
      error: error.localizedDescription
    )
  }
}

let args = CommandLine.arguments
if args.count >= 2 && args[1] == "--probe" {
  emitJSON(ProbePayload(backend: "apple_vision"))
  exit(0)
}

guard args.count >= 2 else {
  fputs("Usage: swift macos-vision.swift <payload.json>\n", stderr)
  exit(1)
}

let payloadURL = URL(fileURLWithPath: args[1])
guard let data = try? Data(contentsOf: payloadURL) else {
  fputs("Could not read payload file\n", stderr)
  exit(1)
}

guard let request = try? JSONDecoder().decode(RequestPayload.self, from: data) else {
  fputs("Could not decode request payload\n", stderr)
  exit(1)
}

let results = request.images.map(analyze(path:))
emitJSON(ResponsePayload(results: results))
`;
