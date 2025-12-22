const { CompositeDisposable } = require("atom");

module.exports = {

  activate() {
    this.disposables = new CompositeDisposable(
      atom.config.observe("scrollmap-linter.threshold", (value) => {
        this.threshold = value;
      }),
    );
    this.messages = [];
  },

  deactivate() {
    this.messages = [];
    this.disposables.dispose();
  },

  provideLinterUI() {
    return {
      name: "scrollmap-linter",
      render: ({ added, messages, removed }) => {
        this.messages = messages;
        for (const editor of atom.workspace.getTextEditors()) {
          const layer = editor.scrollmap?.layers.get('linter');
          if (!layer) continue;
          const editorPath = editor.getPath();
          if (added.some((m) => m.location.file === editorPath) ||
              removed.some((m) => m.location.file === editorPath)) {
            layer.cache.set('data', messages.filter((m) => m.location.file === editorPath));
            layer.update();
          }
        }
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose: () => {},
    };
  },

  provideScrollmap() {
    return {
      name: "linter",
      description: "Linter message markers",
      position: 'left',
      initialize: ({ editor, cache, disposables, update }) => {
        const editorPath = editor.getPath();
        const messages = this.messages.filter((m) => m.location.file === editorPath)
        cache.set('data', messages);
        disposables.add(
          atom.config.onDidChange("scrollmap-linter.threshold", update),
        );
      },
      getItems: ({ editor, cache }) => {
        const items = cache.get('data').map((message) => ({
          row: editor.screenPositionForBufferPosition(
            message.location.position.start
          ).row,
          cls: message.severity,
        }));
        if (this.threshold && items.length > this.threshold) {
          return [];
        }
        return items;
      },
    };
  },
};
