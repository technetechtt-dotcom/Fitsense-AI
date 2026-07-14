import ARKit
import Capacitor
import UIKit

/// FitSenseAR — iOS bridge implementing the `FitSenseNative` contract
/// declared in `src/lib/native/bridge.ts`.
///
/// `measureFoot()` presents a full-screen ARKit view controller that
/// guides the user to tap their heel and their longest toe on the
/// detected floor plane. We compute the metric distance between the
/// two hit-test points in world space and return it as millimetres.
///
/// Width measurement is intentionally NOT done in ARKit here — the
/// existing web pipeline already produces a width via reference-based
/// homography (or the new GrabCut segmentation). On iPhones with LiDAR
/// (Pro / Pro Max from iPhone 12 onward) future revisions can request
/// `ARSceneDepth` and extract a depth-aligned silhouette for width.
@objc(FitSenseARPlugin)
public class FitSenseARPlugin: CAPPlugin {

    /// Capability probe. Called by the JS bridge before showing the
    /// "Measure with sensor" CTA so we can hide it on devices that
    /// don't support world tracking (everything < iPhone 6s).
    @objc func getCapabilities(_ call: CAPPluginCall) {
        let hasArkit = ARWorldTrackingConfiguration.isSupported
        var hasDepth = false
        if #available(iOS 14.0, *) {
            hasDepth = ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)
        }
        call.resolve([
            "hasArkit": hasArkit,
            "hasArcore": false,
            "hasDepthSensor": hasDepth,
            "platform": "ios"
        ])
    }

    /// One-shot foot measurement. Resolves with `{lengthMm, widthMm,
    /// confidence, source}` or rejects with a tagged error string.
    @objc func measureFoot(_ call: CAPPluginCall) {
        guard ARWorldTrackingConfiguration.isSupported else {
            call.reject("ARKit world tracking is not supported on this device.")
            return
        }
        DispatchQueue.main.async {
            let vc = FitSenseARMeasureViewController()
            vc.modalPresentationStyle = .fullScreen
            vc.onResult = { [weak self] result in
                self?.bridge?.viewController?.dismiss(animated: true)
                switch result {
                case .success(let measurement):
                    call.resolve([
                        "lengthMm": measurement.lengthMm,
                        "widthMm": measurement.widthMm,
                        "confidence": measurement.confidence,
                        "source": "arkit"
                    ])
                case .failure(let err):
                    call.reject(err.localizedDescription)
                }
            }
            self.bridge?.viewController?.present(vc, animated: true)
        }
    }
}

// MARK: - Measurement view controller

private struct ARMeasurement {
    let lengthMm: Double
    let widthMm: Double
    let confidence: Double
}

private enum ARMeasureError: LocalizedError {
    case userCancelled
    case noPlane

    var errorDescription: String? {
        switch self {
        case .userCancelled: return "Measurement cancelled."
        case .noPlane: return "Couldn't find a floor plane. Try better lighting."
        }
    }
}

private final class FitSenseARMeasureViewController: UIViewController, ARSCNViewDelegate, ARSessionDelegate {

    var onResult: ((Result<ARMeasurement, Error>) -> Void)?

    private let sceneView = ARSCNView()
    private let reticle = UIView()
    private let promptLabel = UILabel()
    private let captureButton = UIButton(type: .system)
    private let cancelButton = UIButton(type: .system)

    private var heelWorld: simd_float3?
    private var lastHitWorld: simd_float3?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        configureSceneView()
        configureChrome()
        configureSession()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        sceneView.session.pause()
    }

    private func configureSceneView() {
        sceneView.translatesAutoresizingMaskIntoConstraints = false
        sceneView.delegate = self
        sceneView.session.delegate = self
        sceneView.automaticallyUpdatesLighting = true
        view.addSubview(sceneView)
        NSLayoutConstraint.activate([
            sceneView.topAnchor.constraint(equalTo: view.topAnchor),
            sceneView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            sceneView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            sceneView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func configureChrome() {
        reticle.translatesAutoresizingMaskIntoConstraints = false
        reticle.backgroundColor = .clear
        reticle.layer.borderColor = UIColor.systemGreen.cgColor
        reticle.layer.borderWidth = 2
        reticle.layer.cornerRadius = 14
        view.addSubview(reticle)
        NSLayoutConstraint.activate([
            reticle.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            reticle.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            reticle.widthAnchor.constraint(equalToConstant: 28),
            reticle.heightAnchor.constraint(equalToConstant: 28)
        ])

        promptLabel.translatesAutoresizingMaskIntoConstraints = false
        promptLabel.numberOfLines = 0
        promptLabel.textAlignment = .center
        promptLabel.textColor = .white
        promptLabel.font = UIFont.preferredFont(forTextStyle: .headline)
        promptLabel.text = "Aim at your heel and tap Capture."
        promptLabel.backgroundColor = UIColor.black.withAlphaComponent(0.55)
        promptLabel.layer.cornerRadius = 12
        promptLabel.clipsToBounds = true
        promptLabel.layoutMargins = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
        view.addSubview(promptLabel)
        NSLayoutConstraint.activate([
            promptLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            promptLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 16),
            promptLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -16),
            promptLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])

        captureButton.translatesAutoresizingMaskIntoConstraints = false
        captureButton.setTitle("Capture", for: .normal)
        captureButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        captureButton.backgroundColor = UIColor.systemGreen
        captureButton.setTitleColor(.black, for: .normal)
        captureButton.layer.cornerRadius = 28
        captureButton.addTarget(self, action: #selector(onCapture), for: .touchUpInside)
        view.addSubview(captureButton)
        NSLayoutConstraint.activate([
            captureButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            captureButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            captureButton.widthAnchor.constraint(equalToConstant: 200),
            captureButton.heightAnchor.constraint(equalToConstant: 56)
        ])

        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.addTarget(self, action: #selector(onCancel), for: .touchUpInside)
        view.addSubview(cancelButton)
        NSLayoutConstraint.activate([
            cancelButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            cancelButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12)
        ])
    }

    private func configureSession() {
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal]
        if #available(iOS 13.4, *), ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
        }
        sceneView.session.run(config, options: [.resetTracking, .removeExistingAnchors])
    }

    // MARK: Hit-test driven reticle tracking

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        guard let result = raycastCenter(frame: frame) else { return }
        lastHitWorld = simd_make_float3(
            result.worldTransform.columns.3.x,
            result.worldTransform.columns.3.y,
            result.worldTransform.columns.3.z
        )
    }

    private func raycastCenter(frame: ARFrame) -> ARRaycastResult? {
        guard let query = sceneView.raycastQuery(
            from: view.center,
            allowing: .estimatedPlane,
            tracking: .horizontal
        ) else { return nil }
        let results = sceneView.session.raycast(query)
        return results.first
    }

    @objc private func onCapture() {
        guard let hit = lastHitWorld else {
            promptLabel.text = "Move closer to your foot — no plane locked yet."
            return
        }
        if heelWorld == nil {
            heelWorld = hit
            promptLabel.text = "Heel locked. Now aim at your longest toe and tap Capture."
            return
        }
        let heel = heelWorld!
        let toe = hit
        let lengthMeters = simd_distance(heel, toe)
        let lengthMm = Double(lengthMeters) * 1000.0
        // Width is not measured in this flow — see comment on FitSenseARPlugin.
        // Use the 0.38 population ratio as a sensible placeholder; the
        // web layer's segmentation path will refine this when the user
        // continues to a tap-to-measure photo flow.
        let widthMm = lengthMm * 0.38
        let measurement = ARMeasurement(lengthMm: lengthMm, widthMm: widthMm, confidence: 0.95)
        onResult?(.success(measurement))
    }

    @objc private func onCancel() {
        onResult?(.failure(ARMeasureError.userCancelled))
    }
}
