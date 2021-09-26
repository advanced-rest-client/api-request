export default {
  files: "test/**/*.test.js",
  // files: "test/http-request/APIC-689.test.js",
  nodeResolve: true,
  testFramework: {
    config: {
      timeout: 600000,
    },
  },
	browserStartTimeout: 20000,
	testsStartTimeout: 20000,
	testsFinishTimeout: 600000,
};
