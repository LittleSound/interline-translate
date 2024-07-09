<p align="center">
  <img width="124px" height="124px" src="./assets/logo.png" />
</p>

[简体中文](https://github.com/LittleSound/interline-translate/blob/main/README-cn.md)｜English

# Interline Translate

Interline Translate is a VSCode extension that provides code variable name translation within VSCode. The translated text is displayed below the variable name, which is the origin of its name, Interline Translate.

## Features

<!-- Tip: Using animations to showcase your extension is a great way to engage users. We recommend short, focused animations to make it easier for users to follow. -->

- Automatically translates variable names in the code and displays the translated text below them.
- Supports multiple programming languages and translation languages.
- Easy to configure and customize translation options.

<p align="center">
  <img height="300px" src="./assets/interline-demo.gif" />
</p>

<p align="center">
  <img height="100px" src="./assets/status-bar-buttons.png" />
</p>

- You can use the buttons on the status bar to control the translation function.
- Click the secondary button next to it for detailed settings.
- Or you can open the command palette with the shortcut `Ctrl+Shift+P` and enter `Interline Translate` to use the extension's features.

## Requirements

This extension requires the following dependencies:

- A corresponding translation API (e.g., Google Translate API) must be installed and configured.
- An internet connection is required to access the translation services.

## Extension Settings

This extension provides the following settings:

* `interline-translate.translateSelectedText`: Open the translation control panel.
* `interline-translate.startTranslatingDocuments`: Quickly start translating.

<!-- ## Known Issues -->
<!-- List known issues here to help users avoid submitting duplicate issues. -->

## Release Notes

### 0.0.1

Initial release. Implemented basic code variable name translation functionality.


### 0.1.0

- feat: add configs to skip translations for some words ([#4](https://github.com/LittleSound/interline-translate/pull/4))
- feat: format multi-word variables
