import {XpFatal, XpLog} from "../functions/xplogs";
import {rankCard, RankCardOptions} from "../cards";

// TODO: REMOVE THIS

/**
 * @deprecated Use rankCard() instead.
 * Get user rank card
 * @param {Message} message (DISCORD)
 * @param {string} userId
 * @param {string} _guildId
 * @param {RankCardOptions?} options
 * @link `Documentation:` https://simplyxp.js.org/docs/deprecated/rank
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function rank(message: import("discord.js").Message, userId: string, _guildId: string, options?: RankCardOptions): Promise<{ attachment: Buffer, description: string, name: string }> {
	try {
		const pkg = await import("discord.js/package.json");
		if (parseInt(pkg.version.split(".")[0] as string) < 13) XpLog.warn("rank()", "This may not work with Discord.JS v12 or below.");
		else XpLog.debug("rank()", `Discord.JS v${pkg.version} detected.`);
	} catch (error) {
		throw new XpFatal({
			function: "rank()", message: "This function requires Discord.JS, as it is only for Discord bots. | Use rankCard() instead."
		});
	}

	if (!message || !message?.guild) throw new XpFatal({function: "rank()", message: "Invalid Message Provided"});
	if (!userId) throw new XpFatal({function: "rank()", message: "No User ID Provided"});

	XpLog.warn("rank()", "DEPRECATED FUNCTION!! Please use rankCard() instead.");

	const member = await message.guild.members.fetch(userId).catch(() => null) as import("discord.js").GuildMember;

	if (!member) throw new XpFatal({function: "rank()", message: "Member not found"});

	return rankCard({id: message.guild.id, name: message.guild.name}, {id: member.id, username: member.user.username, avatarURL: member.user.displayAvatarURL()}, options);
}