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

        // onDashboardTableUpdateFinish: function (oEvent) {
        //     var oResourceBundle = this.getResourceBundle(),
        //         iCount = oEvent.getParameter("total");
        //     var sTitle = oResourceBundle.getText("notSubmittedTable") + " (" + iCount + ")";
        //     this.byId("idNotSubmittedTitle").setText(sTitle);
        // },
        onTableUpdateFinishNotSubmitted: function (oEvent) {
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
            var oModel = this.getModel();
            let oResourceBundle = this.getResourceBundle();
            var aFilters = [
                new sap.ui.model.Filter(
                    "ApproverFlag",
                    sap.ui.model.FilterOperator.EQ,
                    "10"
                ),
                new sap.ui.model.Filter(
                    "Status",
                    sap.ui.model.FilterOperator.EQ,
                    "Confirmed"
                ),
                new sap.ui.model.Filter(
                    "FormNo",
                    sap.ui.model.FilterOperator.EQ,
                    "FORM10"
                )
            ];
            BusyIndicator.show(0);
            oModel.read("/Form9headSet", {
                filters: aFilters,
                success: function (oData) {
                    var aData = oData.results.map(function (oData) {
                        var oRow = Object.assign({}, oData);
                        oRow.CreatedOn = formatter.formatDate(oRow.CreatedOn);
                        oRow.ConfirmedOn = formatter.formatDate(oRow.ConfirmedOn);

                        return oRow;
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
                            BusyIndicator.hide();
                        });

                }.bind(this),
                error: function () {
                    BusyIndicator.hide();
                    messenger.error(oResourceBundle.getText("failedToDownloadData"));
                }
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
            var oModel = this.getView().getModel();
            var aFilters = [
                new sap.ui.model.Filter(
                    "StatusFlag",
                    sap.ui.model.FilterOperator.EQ,
                    "NotSubmitted"
                ),
                new sap.ui.model.Filter(
                    "Fyear",
                    sap.ui.model.FilterOperator.EQ,
                    "2026-2027"
                )
            ];
            oModel.read("/Form10_DashboardSet", {
                filters: aFilters,
                success: function (oData) {
                    var aData = oData.results.map(function (oData) {
                        var oRow = Object.assign({}, oData);
                        return oRow;
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
                }.bind(this),
                error: function () {
                    sap.m.MessageToast.show(
                        "Failed to fetch data for download."
                    );
                }
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
        onSendNotificationPress: async function () {
            const oTable = this.byId("idNotSubmittedTable");
            const oModel = this.getModel();
            const aSelectedItems = oTable.getSelectedItems();
            let oResourceBundle = this.getResourceBundle();
            if (aSelectedItems.length === 0) {
                messenger.error(oResourceBundle.getText("atleastOneEmployeeError"));
                return;
            }
            const aPernrs = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext().getProperty("Pernr");
            });
            const aPernrFilters = aPernrs.map(function (sPernr) {
                return new Filter(
                    "Pernr",
                    FilterOperator.EQ,
                    sPernr
                );
            });
            const aFilters = [
                new Filter(
                    "StatusFlag",
                    FilterOperator.EQ,
                    "NotSubmitted"
                ),
                new Filter(
                    "Fyear",
                    FilterOperator.EQ,
                    "2026-2027"
                ),
                new Filter(
                    "SendNotif",
                    FilterOperator.EQ,
                    "X"
                ),
                new Filter({
                    filters: aPernrFilters,
                    and: false
                })
            ];
            oModel.read("/Form10_DashboardSet", {
                filters: aFilters,
                success: function (oData) {
                    messenger.success(oResourceBundle.getText("notificationSent"));
                    resolve();
                },
                error: function (oError) {
                    messenger.error(oResourceBundle.getText("notificationFailed"));
                    reject();
                }
            });
        },
        onSendNotificationPressAll: function () {
            const oTable = this.byId("idNotSubmittedTable");
            const oModel = this.getModel();
            let oResourceBundle = this.getResourceBundle();
            const aSelectedItems = oTable.getItems();
            if (aSelectedItems.length === 0) {
                messenger.error(oResourceBundle.getText("atleastOneEmployeeError"));
                return;
            }
            const aPernrs = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext().getProperty("Pernr");
            });
            const aFilters = [
                new Filter(
                    "StatusFlag",
                    FilterOperator.EQ,
                    "NotSubmitted"
                ),
                new Filter(
                    "Fyear",
                    FilterOperator.EQ,
                    "2026-2027"
                ),
                new Filter(
                    "SendNotif",
                    FilterOperator.EQ,
                    "X"
                )
            ];
            oModel.read("/Form10_DashboardSet", {
                filters: aFilters,
                success: function (oData) {
                    messenger.success(oResourceBundle.getText("notificationSent"));
                    resolve();
                },
                error: function (oError) {
                    messenger.error(oResourceBundle.getText("notificationFailed"));
                    reject();
                }
            });
        }

    });
});