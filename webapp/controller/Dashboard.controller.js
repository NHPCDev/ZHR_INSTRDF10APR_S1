sap.ui.define([
    "com/nhpc/zhrinstrdf10aprs1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "com/nhpc/zhrinstrdf10aprs1/utils/formatter",
    "com/nhpc/zhrinstrdf10aprs1/utils/messenger",
    "sap/ui/core/BusyIndicator",
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator) => {
    "use strict";

    return BaseController.extend("com.nhpc.zhrinstrdf10aprs1.controller.Dashboard", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
        },
        _onRoutePatternMatched: function (oEvent) {
            this.getModel().refresh();
            const oTable = this.byId("idDashboardTable");
            const oBinding = oTable.getBinding("items");
            oBinding.attachEventOnce("dataReceived", () => {
                const iCount = oBinding.getLength();
                this.getModel("viewModel").setProperty("/dashboardCount", iCount);
            });
        },
        onDashboardSegmentChange: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            this.byId("idDashboardTable").setVisible(
                sKey === "submitted"
            );
            this.byId("idNotSubmittedTable").setVisible(
                sKey === "notSubmitted"
            );
        },

        onDashboardTableUpdateFinish: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("notSubmittedTable") + " (" + iCount + ")";
            this.byId("idNotSubmittedTitle").setText(sTitle);
        },
        onTableUpdateFinishNotSubmitted:function(oEvent){
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("notSubmittedTable") + " (" + iCount + ")";
            this.byId("idNotSubmittedTitle").setText(sTitle);
        },
        onCreate: function () {
            this.getRouter().navTo("RouteDetail", {
                Sno: "New",
                Pernr: "New"
            });
        },
        onListItemPress: async function (oEvent) {
            // await this.resetModel();
            var oObject = oEvent.getSource()
                .getBindingContext()
                .getObject();

            this.getRouter().navTo("RouteDetail", {
                selectedYear: oObject.Fyear,
                Pernr: oObject.Pernr
            });
        },
        onSearchBtn: function (oEvent) {
            var oTable = this.byId("idDashboardTable");
            let oFilterData = this._getTableFilters();
            oTable.getBinding("items").filter(oFilterData.aFilters);
            const oBinding = oTable.getBinding("items");
            oBinding.attachEventOnce("dataReceived", () => {
                const iCount = oBinding.getLength();
                this.getModel("viewModel").setProperty("/dashboardCount", iCount);
            });
        },

        _getTableFilters: function (oEvent) {
            var oViewModel = this.getModel("viewModel"),
                oFilterData = oViewModel.getProperty("/filterData"),
                aSearchFilter = [];
            if (oFilterData.Fyear) {
                let aFilters = [];
                aFilters.push(new Filter("Fyear", FilterOperator.EQ, oFilterData.Fyear));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            return {
                aFilters: aSearchFilter.length
                    ? [new Filter({
                        filters: aSearchFilter,
                        and: true
                    })]
                    : []
            }
        },
        // onCreate: function () {
        //     var oView = this.getView();
        //     if (!this._CreateDialog) {
        //         Fragment.load({
        //             id: oView.getId(),
        //             name: "com.nhpc.zhrinstrdf10aprs1.fragment.Create",
        //             controller: this
        //         }).then(function (oDialog) {
        //             this._CreateDialog = oDialog;
        //             oView.addDependent(oDialog);
        //             const oTable = this.byId("idDashboardTable");
        //             const oBinding = oTable.getBinding("items");
        //             const aContexts = oBinding.getContexts();
        //             const aCreatedYears = aContexts.map(oContext =>
        //                 oContext.getProperty("Fyear")
        //             );
        //             const aFilters = aCreatedYears.map(
        //                 sYear => new Filter("Year", FilterOperator.NE, sYear)
        //             );
        //             const oComboBox = this.byId("idFyear");
        //             oComboBox.getBinding("items").filter(aFilters);
        //             oDialog.open();
        //         }.bind(this));
        //     } else {
        //         this._CreateDialog.open();
        //     }
        // },
        onCreate: function () {
            var oView = this.getView();
            let oModel = this.getModel();
            const fnFilterFinancialYears = function () {
                const oTable = this.byId("idDashboardTable");
                const oBinding = oTable.getBinding("items");
                const aContexts = oBinding.getContexts();
                const aCreatedYears = [
                    ...new Set(
                        aContexts
                            .map(oContext => oContext.getProperty("Fyear"))
                            .filter(Boolean)
                    )
                ];
                const aFilters = aCreatedYears.map(
                    sYear => new Filter(
                        "Year",
                        FilterOperator.NE,
                        sYear
                    )
                );
                const oComboBox = this.byId("idFyear");
                const oComboBinding = oComboBox.getBinding("items");
                if (oComboBinding) {
                    oComboBinding.filter(aFilters);
                }
            }.bind(this);
            if (!this._CreateDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.Create",
                    controller: this
                }).then(function (oDialog) {
                    this._CreateDialog = oDialog;
                    oView.addDependent(oDialog);
                    fnFilterFinancialYears();
                    oDialog.open();
                }.bind(this));
            } else {
                fnFilterFinancialYears();
                this._CreateDialog.open();
            }
        },
        onCloseDialog: function () {
            this._CreateDialog.close();
        },
        onYearSelect: function () {
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            let sSelectedYear = oViewModel.getProperty("/selectedYear");
            if (!sSelectedYear) {
                oViewModel.setProperty("/valueState/selectedYear", "Error");
                oViewModel.setProperty("/valueStateText/selectedYear", oResourceBundle.getText("selectedYearErrorMsg"));
                messenger.error(oResourceBundle.getText("selectedYearErrorMsg"));
                return;
            }
            oViewModel.setProperty("/valueState/selectedYear", "None");
            oViewModel.setProperty("/valueStateText/selectedYear", "");
            this.getRouter().navTo("RouteDetail", {
                selectedYear: sSelectedYear,
                Pernr: "New",
            });
        },
        onDownload: function () {
            var oTable = this.byId("idDashboardTable");
            var oBinding = oTable.getBinding("items");
            var aData = oBinding.getContexts().map(function (oContext) {
                var oData = Object.assign({}, oContext.getObject());
                oData.CreatedOn = formatter.formatDate(oData.CreatedOn);
                oData.ConfirmedOn = formatter.formatDate(oData.ConfirmedOn);
                return oData;
            });
            var aCols = this.createColumnConfig();
            var oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: aData,
                fileType: "xlsx",
                fileName: this.getResourceBundle().getText("title")
            };
            var oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .finally(function () {
                    oSheet.destroy();
                });
        },
        createColumnConfig: function () {
            var aCols = [];
            aCols.push({
                label: this.getResourceBundle().getText("fYear"),
                property: "Fyear"
            });
            aCols.push({
                label: this.getResourceBundle().getText("employeeID"),
                property: "Pernr"
            });
            aCols.push({
                label: this.getResourceBundle().getText("employeeNameLabel"),
                property: "EmployeeName"
            });
            aCols.push({
                label: this.getResourceBundle().getText("createdOn"),
                property: "CreatedOn",
            });
            aCols.push({
                label: this.getResourceBundle().getText("confirmedOn"),
                property: "ConfirmedOn",
            });
            aCols.push({
                label: this.getResourceBundle().getText("confirmedBy"),
                property: "EmployeeName"
            });
            aCols.push({
                label: this.getResourceBundle().getText("status"),
                property: "Status"
            });
            return aCols;
        },
        onDownloadNotSubmitted: function () {
            var oTable = this.byId("idNotSubmittedTable");
            var oBinding = oTable.getBinding("items");
            var aData = oBinding.getContexts().map(function (oContext) {
                var oData = Object.assign({}, oContext.getObject());
                return oData;
            });
            var aCols = this.createColumnConfigNotSubmitted();
            var oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: aData,
                fileType: "xlsx",
                fileName: this.getResourceBundle().getText("title")
            };
            var oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .finally(function () {
                    oSheet.destroy();
                });
        },
        createColumnConfigNotSubmitted: function () {
            var aCols = [];
            aCols.push({
                label: this.getResourceBundle().getText("pernr"),
                property: "Pernr"
            });
            aCols.push({
                label: this.getResourceBundle().getText("fYear"),
                property: "Fyear"
            });
            aCols.push({
                label: this.getResourceBundle().getText("empName"),
                property: "EmpName"
            });
            aCols.push({
                label: this.getResourceBundle().getText("designation"),
                property: "Designation",
            });
            aCols.push({
                label: this.getResourceBundle().getText("placeOfWork"),
                property: "Placeofwork",
            });
            aCols.push({
                label: this.getResourceBundle().getText("status"),
                property: "Status"
            });
            return aCols;
        },
        onValueHelpRequest: async function (oEvent) {
            this._oInput = oEvent.getSource();
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.EmployeeValueHelp",
                    controller: this
                });
                this.getView().addDependent(this._oValueHelpDialog);
            }
            this._oValueHelpDialog.open();
        },
        onValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter(
                "Empid",
                FilterOperator.Contains,
                sValue
            );
            var oFilter2 = new Filter(
                "FullName",
                FilterOperator.Contains,
                sValue
            );
            var oCombinedFilter = new Filter({
                filters: [oFilter, oFilter2],
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oCombinedFilter]);
        },
        onValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this._oInput.setValue(oSelectedItem.getTitle());
                this.getModel("viewModel").setProperty("/filterData/Pernr", oSelectedItem.getTitle());
            }
        },

    });
});