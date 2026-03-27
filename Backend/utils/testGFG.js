const fetchGFG = require("./gfg");

(async () => {
  const username = "nitish007k";

  const data = await fetchGFG(username);

  console.log("\n================ FULL HTML ================\n");
  console.log(data.html);

  console.log("\n================ FULL TEXT ================\n");
  console.log(data.text);

  process.exit();
})();