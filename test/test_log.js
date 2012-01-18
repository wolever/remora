test("logs are correctly captured", function() {
  remora.log("stuff", 123);
  equal(logMessages.length, 1);
  deepEqual(logMessages[0], { level: "log", args: ["stuff", 123] });
});

test("captured logs are correctly reset", function() {
  remora.log.warning("stuff", 123);
  equal(logMessages.length, 1);
  deepEqual(logMessages[0], { level: "warn", args: ["stuff", 123] });
});

