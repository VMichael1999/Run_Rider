import ExpoModulesCore

public final class LiquidGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiquidGlass")

    // true si el sistema dibuja Liquid Glass real (iOS 26 o más).
    Function("isAvailable") { () -> Bool in
      return LiquidGlassView.isLiquidGlassAvailable
    }

    View(LiquidGlassView.self) {
      Prop("glassStyle") { (view, style: String?) in
        view.glassStyle = style ?? "regular"
      }
      Prop("tintColor") { (view, color: UIColor?) in
        view.tint = color
      }
      Prop("interactive") { (view, interactive: Bool?) in
        view.interactive = interactive ?? false
      }
      Prop("cornerRadius") { (view, radius: Double?) in
        view.cornerRadius = CGFloat(radius ?? 0)
      }
      Prop("colorScheme") { (view, scheme: String?) in
        view.colorScheme = scheme ?? "light"
      }
      OnViewDidUpdateProps { view in
        view.applyEffect()
      }
    }
  }
}
