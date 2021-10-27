module.exports.msToTime = (ms) => {
    const
        days = Math.floor(ms / 86400000), // 24*60*60*1000
        daysms = ms % 86400000, // 24*60*60*1000
        hours = Math.floor(daysms / 3600000), // 60*60*1000
        hoursms = ms % 3600000, // 60*60*1000
        minutes = Math.floor(hoursms / 60000), // 60*1000
        minutesms = ms % 60000, // 60*1000
        sec = Math.floor(minutesms / 1000);

    let str = "";
    if (days) str = str + days + "дн ";
    if (hours) str = str + hours + "ч ";
    if (minutes) str = str + minutes + "мин ";
    if (sec) str = str + sec + "с";

    return str?.trim() || "0с";
};