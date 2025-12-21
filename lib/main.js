const { Disposable } = require("atom");

module.exports = {

  activate() {
    this.editors = new Map();
    this.messages = [];
  },

  deactivate() {
    this.editors.clear();
    this.messages = [];
  },

  provideLinterUI() {
    const self = this;
    return {
      name: "scrollmap-linter",
      render: ({ added, messages, removed }) => {
        self.messages = messages;
        for (const ctx of self.editors.values()) {
          const editorPath = ctx.editor.getPath();
          if (added.some((m) => m.location.file === editorPath) ||
              removed.some((m) => m.location.file === editorPath)) {
            ctx.update();
          }
        }
      },
      didBeginLinting() {},
      didFinishLinting() {},
      dispose: () => {},
    };
  },

  provideScrollmap() {
    const self = this;
    return {
      name: "linter",
      subscribe: (editor, update) => {
        self.editors.set(editor, { editor, update });
        return new Disposable(() => self.editors.delete(editor));
      },
      recalculate: (editor) => {
        const editorPath = editor.getPath();
        const editorMessages = self.messages.filter(
          (m) => m.location.file === editorPath
        );
        return editorMessages.map((message) => ({
          row: editor.screenPositionForBufferPosition(
            message.location.position.start
          ).row,
          cls: message.severity,
        }));
      },
    };
  },
};
