const { Message } = require("discord.js");

module.exports = {
	aliases: ["evaluate", "ev"],
	permissionRequired: 5,
	checkArgs: (args) => !!args.length
};

module.exports.run = async (message = new Message, args) => {
	let content = args.join(" ");

	try {
		let evaled = await eval(content);
		if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

		if (evaled.length > 2000) message.react("✅").catch();
		else message.reply(`\`\`\`js\n${evaled}\n\`\`\``).catch();
	} catch (e) {
		let err;
		if (typeof e == "string") err = e.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
		else err = e;

		message.reply(`\`\`\`js\n${err}\n\`\`\``).catch();
	};
};