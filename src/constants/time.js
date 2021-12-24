module.exports.getDateFormatted = (d) => {
    let month = (d.getMonth() + 1).toString(), day = d.getDate().toString(), year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
};
