require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name = 'MigrantTranslation'
  s.version = package['version']
  s.summary = 'On-device translation for Munca fără abuz.'
  s.description = s.summary
  s.license = 'MIT'
  s.author = 'Munca fără abuz'
  s.homepage = 'https://expo.dev'
  s.platforms = { :ios => '15.5' }
  s.swift_version = '5.9'
  s.source = { git: 'https://expo.dev' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMLKit/Translate', '8.0.0'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,swift}'
end
