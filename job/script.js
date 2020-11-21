let args = require("minimist")(process.argv.slice(2));

if (args["f"] && args["m"]) {
  main(args["m"], args["f"]).then(() => process.exit(1)).catch(console.error);
}

async function main(mod, func) {
  console.time("script");
  const script = require("./script/index");

  if (!mod && func && Object.prototype.hasOwnProperty.call(script, func)) {
    await script[func]();
    console.timeEnd("script");
    return;
  }
  else if (!Object.prototype.hasOwnProperty.call(script, mod)) {
    console.error("Module Not Found.");
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(script[mod], func)) {
    console.error("Function Not Found.");
    return;
  }

  await script[mod][func]();

  console.timeEnd("script");
}
