"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateFormatted = void 0;
function getDateFormatted(d) {
    let month = (d.getMonth() + 1).toString(), day = d.getDate().toString(), year = d.getFullYear();
    if (month.length < 2)
        month = "0" + month;
    if (day.length < 2)
        day = "0" + day;
    return [year, month, day].join("-");
}
exports.getDateFormatted = getDateFormatted;
;
