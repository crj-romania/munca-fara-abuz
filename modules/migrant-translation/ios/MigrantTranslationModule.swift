import ExpoModulesCore
import MLKitTranslate

public final class MigrantTranslationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MigrantTranslation")

    Function("getSupportedLanguages") {
      TranslateLanguage.allLanguages().map(\.rawValue).sorted()
    }

    AsyncFunction("prepare") { (source: String, target: String, promise: Promise) in
      guard let translator = self.makeTranslator(source: source, target: target) else {
        promise.reject("E_LANGUAGE_UNSUPPORTED", "E_LANGUAGE_UNSUPPORTED")
        return
      }

      let conditions = ModelDownloadConditions(
        allowsCellularAccess: false,
        allowsBackgroundDownloading: true
      )

      // A Translator configured with both languages downloads both required models.
      translator.downloadModelIfNeeded(with: conditions) { [translator] error in
        // This capture retains the translator only through this completion; ARC then releases it.
        _ = translator
        if error == nil {
          promise.resolve()
        } else {
          promise.reject("E_MODEL_DOWNLOAD_FAILED", "E_MODEL_DOWNLOAD_FAILED")
        }
      }
    }

    AsyncFunction("translate") { (text: String, source: String, target: String, promise: Promise) in
      guard let translator = self.makeTranslator(source: source, target: target) else {
        promise.reject("E_LANGUAGE_UNSUPPORTED", "E_LANGUAGE_UNSUPPORTED")
        return
      }

      translator.translate(text) { [translator] translatedText, error in
        // This capture retains the translator only through this completion; ARC then releases it.
        _ = translator
        if error == nil, let translatedText {
          promise.resolve(translatedText)
        } else {
          promise.reject("E_TRANSLATION_FAILED", "E_TRANSLATION_FAILED")
        }
      }
    }

    AsyncFunction("deleteModel") { (language: String, promise: Promise) in
      guard language != TranslateLanguage.english.rawValue,
            let translateLanguage = TranslateLanguage.fromLanguageTag(language) else {
        promise.resolve()
        return
      }

      let model = TranslateRemoteModel.translateRemoteModel(language: translateLanguage)
      let manager = ModelManager.modelManager()
      guard manager.downloadedTranslateModels.contains(AnyHashable(model)) else {
        promise.resolve()
        return
      }

      manager.deleteDownloadedModel(model) { error in
        if error == nil {
          promise.resolve()
        } else {
          promise.reject("E_MODEL_DELETE_FAILED", "E_MODEL_DELETE_FAILED")
        }
      }
    }
  }

  private func makeTranslator(source: String, target: String) -> Translator? {
    guard let sourceLanguage = TranslateLanguage.fromLanguageTag(source),
          let targetLanguage = TranslateLanguage.fromLanguageTag(target) else {
      return nil
    }

    let options = TranslatorOptions(sourceLanguage: sourceLanguage, targetLanguage: targetLanguage)
    return Translator.translator(options: options)
  }
}
