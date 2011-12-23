define(["PEG", "text!remora/grammar.pegjs"], function(PEG, grammar) {
  try {
    return PEG.buildParser(grammar);
  } catch (e) {
    log("Parse error at column", e.column, "on line", e.line, "of grammar:", e.message)
    throw e;
  }
});
