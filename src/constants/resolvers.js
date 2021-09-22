module.exports.parseTime = (input = "", outputType = "ms") => {

    var durationRE = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([\p{L}]*)/uig;

    parse.nanosecond =
        parse.ns = 1 / 1e6;

    parse['µs'] =
        parse['μs'] =
        parse.us =
        parse.microsecond = 1 / 1e3;

    parse.millisecond =
        parse.ms =
        parse[''] = 1;

    parse.second =
        parse.sec =
        parse.s = parse.ms * 1000;

    parse.minute =
        parse.min =
        parse.m = parse.s * 60;

    parse.hour =
        parse.hr =
        parse.h = parse.m * 60;

    parse.day =
        parse.d = parse.h * 24;

    parse.week =
        parse.wk =
        parse.w = parse.d * 7;

    parse.month =
        parse.b =
        parse.d * (365.25 / 12);

    parse.year =
        parse.yr =
        parse.y = parse.d * 365.25;

    let result = null;
    // ignore commas/placeholders
    input = (input + '').replace(/(\d)[,_](\d)/g, '$1$2');
    input.replace(durationRE, function (_, n, units) {
        units = unitRatio(units);
        if (units) result = (result || 0) + parseFloat(n, 10) * units;
    });

    return result && (result / (unitRatio(outputType) || 1));

    function unitRatio(str) {
        return parse[str] || parse[str.toLowerCase().replace(/s$/, '')];
    };
};