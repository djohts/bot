module.exports = {
	aliases: ["evaluate", "ev"],
	permissionRequired: 5,
	checkArgs: (args) => !!args.length
};

module.exports.run = async (message, args) => {
	let content = args.join(" ");

	try {
		let evaled = await eval(content);
		if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

		message.reply({ content: evaled, code: "js", split: true });
	} catch (e) {
		let err;
		if (typeof e == "string") err = e.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
		else err = e;
		message.reply({ content: err, code: "js", split: true });
	};
};