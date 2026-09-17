package expo.modules.migranttranslation

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateRemoteModel
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MigrantTranslationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MigrantTranslation")

    Function("getSupportedLanguages") {
      TranslateLanguage.getAllLanguages().sorted()
    }

    AsyncFunction("prepare") { source: String, target: String, promise: Promise ->
      val translator = createTranslator(source, target)
      if (translator == null) {
        promise.reject("E_LANGUAGE_UNSUPPORTED", "E_LANGUAGE_UNSUPPORTED", null)
        return@AsyncFunction
      }

      val conditions = DownloadConditions.Builder()
        .requireWifi()
        .build()

      // A Translator configured with both languages downloads both required models.
      translator.downloadModelIfNeeded(conditions)
        .addOnSuccessListener {
          translator.close()
          promise.resolve()
        }
        .addOnFailureListener { error ->
          translator.close()
          promise.reject("E_MODEL_DOWNLOAD_FAILED", "E_MODEL_DOWNLOAD_FAILED", error)
        }
    }

    AsyncFunction("translate") { text: String, source: String, target: String, promise: Promise ->
      val translator = createTranslator(source, target)
      if (translator == null) {
        promise.reject("E_LANGUAGE_UNSUPPORTED", "E_LANGUAGE_UNSUPPORTED", null)
        return@AsyncFunction
      }

      translator.translate(text)
        .addOnSuccessListener { translatedText ->
          translator.close()
          promise.resolve(translatedText)
        }
        .addOnFailureListener { error ->
          translator.close()
          promise.reject("E_TRANSLATION_FAILED", "E_TRANSLATION_FAILED", error)
        }
    }

    AsyncFunction("deleteModel") { language: String, promise: Promise ->
      if (language == TranslateLanguage.ENGLISH) {
        promise.resolve()
        return@AsyncFunction
      }

      val translateLanguage = TranslateLanguage.fromLanguageTag(language)
      if (translateLanguage == null) {
        promise.resolve()
        return@AsyncFunction
      }

      val model = TranslateRemoteModel.Builder(translateLanguage).build()
      val manager = RemoteModelManager.getInstance()
      manager.getDownloadedModels(TranslateRemoteModel::class.java)
        .addOnSuccessListener { models ->
          if (!models.contains(model)) {
            promise.resolve()
            return@addOnSuccessListener
          }
          manager.deleteDownloadedModel(model)
            .addOnSuccessListener { promise.resolve() }
            .addOnFailureListener { error ->
              promise.reject("E_MODEL_DELETE_FAILED", "E_MODEL_DELETE_FAILED", error)
            }
        }
        .addOnFailureListener { error ->
          promise.reject("E_MODEL_DELETE_FAILED", "E_MODEL_DELETE_FAILED", error)
        }
    }
  }

  private fun createTranslator(source: String, target: String): Translator? {
    val sourceLanguage = TranslateLanguage.fromLanguageTag(source) ?: return null
    val targetLanguage = TranslateLanguage.fromLanguageTag(target) ?: return null
    val options = TranslatorOptions.Builder()
      .setSourceLanguage(sourceLanguage)
      .setTargetLanguage(targetLanguage)
      .build()
    return Translation.getClient(options)
  }
}
