var newWkstTemplate = {
    year: undefined,
    month: undefined,
    debits: [],
    credits: []
};

var monthNames = ["Unknown", "January", "February", "March",
                  "April", "May", "June", "July", "August",
                  "September", "October", "November", "December"];

// Route manager handles loading templates and binding data that's being 'flown' in
var RouteManager = function(vm) {

    this.newWorksheetRoute = crossroads.addRoute('new', function() {

    }.bind(this));

    this.previousWorksheetRoute = crossroads.addRoute('previous', function(){

    }.bind(this));

    this.nextWorksheetRoute = crossroads.addRoute('next', function(){

    }.bind(this));

    crossroads.bypassed.add(function(request) {
        vm.currentWorksheet(wsModelToViewModel(worksheet));
        vm.showWorksheet(true);
        ko.applyBindings(vm);
    });

    return this;
};

var MainViewModel = function() {

    var _routeManager = new RouteManager(this);

    this.menu = ko.observableArray([
        { label: "New Worksheet", link: "new" },
        { label: "Previous Month", link: "previous" },
        { label: "Next Month", link: "next" },
    ]);

    this.currentWorksheet = ko.observable(wsModelToViewModel(newWkstTemplate));

    this.showWorksheet = ko.observable(true);

    this.activeTemplate = ko.observable("worksheet");

    this.templateOption = function() {
        return this.activeTemplate();
    }.bind(this);

    this.handleHashChange = function(newHash, oldHash) {
        crossroads.parse(newHash);
    };

    this.onNavigation = function(hash) {
        hasher.setHash(hash);
        return false;
    };

    hasher.changed.add(this.handleHashChange);

};

var worksheet = {
    name: "October",
    year: 2011,
    month: 10,
    debits: [
        {type: "debit", category: "Rent", budgeted: 1150, actual: 0, closed: true, dueDate: new Date()},
        {type: "debit", category: "Groceries", budgeted: 700, actual: 201.57, closed: false, dueDate: new Date()},
        {type: "debit", category: "Electricity", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
        {type: "debit", category: "Gas", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
        {type: "debit", category: "Water", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
        {type: "debit", category: "Cable TV/Internet", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
        {type: "debit", category: "Toiletries", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
        {type: "debit", category: "Misc.", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
        {type: "debit", category: "Office Supplies", budgeted: 200, actual: 220, closed: false, dueDate: new Date()},
        {type: "debit", category: "Other Crap", budgeted: 200, actual: 220, closed: true, dueDate: new Date()},
    ],
    credits: [
        {type: "credit", category: "Salary", budgeted: 4000, actual: 4000, closed: true, dueDate: new Date()}
    ]
};

var itemModelToViewModel = function(model) {
    var vm = {
        type: ko.observable(model.type),
        category: ko.observable(model.category),
        budgeted: ko.observable(model.budgeted),
        actual: ko.observable(model.actual),
        closed: ko.observable(model.closed || false),
        dueDate: ko.observable(model.dueDate)
    };
    vm.enabled = ko.dependentObservable(function() {
        return !this.closed();
    }, vm);
    vm.dueDateDisplay = ko.dependentObservable(function() {
        if(jQuery.type(this.dueDate()) === "date") {
            return this.dueDate().getFullYear() + "-" + (this.dueDate().getMonth() + 1) + "-" + this.dueDate().getDate();
        }
        return "?";
    }, vm);
    return vm;
};

var wsModelToViewModel = function(model) {
    var vm = {
        year: ko.observable(model.year),
        month: ko.observable(model.month),
        debits: ko.observableArray([]),
        credits: ko.observableArray([])
    };
    model.credits.forEach(function(credit) {
        vm.credits().push(itemModelToViewModel(credit));
    });
    model.debits.forEach(function(debit) {
        vm.debits().push(itemModelToViewModel(debit));
    });
    vm.name = ko.dependentObservable(function(){
        return monthNames[this.month()] + " " + this.year();
    }, vm);
    vm.budgetDebitTotal = ko.dependentObservable(function(){
        var total = 0;
        $(this.debits()).each(function(x,y) { total += +y.budgeted(); });
        return (total).toFixed(2);
    }, vm);
    vm.budgetCreditTotal = ko.dependentObservable(function(){
        var total = 0;
        $(this.credits()).each(function(x,y) { total += +y.budgeted(); });
        return (total).toFixed(2);
    }, vm);
    vm.actualDebitTotal = ko.dependentObservable(function(){
        var total = 0;
        $(this.debits()).each(function(x,y) { total += +y.actual(); });
        return (total).toFixed(2);
    }, vm);
    vm.actualCreditTotal = ko.dependentObservable(function(){
        var total = 0;
        $(this.credits()).each(function(x,y) { total += +y.actual(); });
        return (total).toFixed(2);
    }, vm);
    vm.budgetedRemainder = ko.dependentObservable(function(){
        return +this.budgetCreditTotal() - +this.budgetDebitTotal();
    }, vm);
    vm.projectedCreditTotal = ko.dependentObservable(function(){
        var total = 0;
        $(this.credits()).each(function(x,y) { total += y.closed() ? +y.actual() : +y.budgeted(); });
        return (total).toFixed(2);
    }, vm);
    vm.projectedDebitTotal = ko.dependentObservable(function(){
        var total = 0;
        $(this.debits()).each(function(x,y) { total += y.closed() ? +y.actual() : +y.budgeted(); });
        return (total).toFixed(2);
    }, vm);
    vm.projectedRemainder = ko.dependentObservable(function(){
        return (+this.projectedCreditTotal() - +this.projectedDebitTotal()).toFixed(2);
    }, vm);
    return vm;
};

$(function() {
    if(ko.externaljQueryTemplateEngine) {
        ko.externaljQueryTemplateEngine.setOptions({
            templateUrl: "template",
            templatePrefix: "",
            templateSuffix: ".html"
        });
    }
    window.vm = new MainViewModel();
    ko.applyBindings(vm);
    hasher.init();
    var hash = hasher.getHash();
    //if(hash) {
        crossroads.parse(hash);
    //}
});