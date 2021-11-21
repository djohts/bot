module.exports = Object.assign(
    {
        limitTriggers: 5,
        limitActions: 10,
        limitFlows: 15
    },
    require("./propertyTypes"),
    require("./walkthrough"),
    require("./flow")
);