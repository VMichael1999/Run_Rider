import ExpoModulesCore
import UIKit

/// Fondo de vidrio sin hijos: el contenido de React Native va encima, como hermano.
/// Así funciona igual con la arquitectura anterior (no necesita montar hijos en el contentView).
/// En iOS 26 usa UIGlassEffect (refracción, dispersión, luz de borde); antes, un desenfoque del sistema.
public final class LiquidGlassView: ExpoView {
  static var isLiquidGlassAvailable: Bool {
    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      return true
    }
    #endif
    return false
  }

  private let effectView = UIVisualEffectView(effect: nil)

  var glassStyle = "regular"
  var tint: UIColor?
  var interactive = false
  var cornerRadius: CGFloat = 0
  var colorScheme = "light"

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    effectView.frame = bounds
    effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(effectView)
    applyEffect()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    effectView.frame = bounds
    applyCorners()
  }

  func applyEffect() {
    overrideUserInterfaceStyle = colorScheme == "dark" ? .dark : (colorScheme == "auto" ? .unspecified : .light)

    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      let effect = UIGlassEffect(style: glassStyle == "clear" ? .clear : .regular)
      effect.tintColor = tint
      effect.isInteractive = interactive
      // Hay que volver a asignar el efecto para que tome los cambios.
      effectView.effect = effect
      applyCorners()
      return
    }
    #endif

    effectView.effect = UIBlurEffect(style: colorScheme == "dark" ? .systemChromeMaterialDark : .systemChromeMaterialLight)
    applyCorners()
  }

  private func applyCorners() {
    let radius = min(cornerRadius, min(bounds.width, bounds.height) / 2)
    effectView.layer.cornerRadius = radius
    effectView.layer.cornerCurve = .continuous
    effectView.clipsToBounds = radius > 0
  }
}
