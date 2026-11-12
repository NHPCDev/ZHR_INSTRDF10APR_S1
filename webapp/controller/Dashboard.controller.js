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
    "sap/ui/model/json/JSONModel",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Column",
    "sap/m/Text",
    "sap/ui/export/library"
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator,JSONModel, SearchField, UIColumn, Label, MColumn, Text,exportLibrary) => {
    "use strict";
    var EdmType = exportLibrary.EdmType;
    return BaseController.extend("com.nhpc.zhrinstrdf10aprs1.controller.Dashboard", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
        },
        _onRoutePatternMatched: function (oEvent) {
            this.getModel().refresh();
            this.oEmployeeModel = new JSONModel(sap.ui.require.toUrl("com/nhpc/zhrinstrdf10aprs1/model") + "/employee.json");
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
            var oNStable = this.byId("idNotSubmittedTable");
            let oFilterData = this._getTableFilters();
            let oViewModel = this.getModel("viewModel");
            let sSelectedtable = oViewModel.getProperty("/selectedSegementedButton")
            if (sSelectedtable !== "notSubmitted") {
                oTable.getBinding("items").filter(oFilterData.aFilters);
                const oBinding = oTable.getBinding("items");
                oBinding.attachEventOnce("dataReceived", () => {
                    const iCount = oBinding.getLength();
                    this.getModel("viewModel").setProperty("/dashboardCount", iCount);
                });
            } else {
                oNStable.getBinding("items").filter(oFilterData.aFilters);
                this.onTableUpdateFinishNotSubmitted();
            }

        },

        _getTableFilters: function (oEvent) {
            var oViewModel = this.getModel("viewModel"),
                oFilterData = oViewModel.getProperty("/filterData"),
                aSearchFilter = [];
            let sSelectedtable = oViewModel.getProperty("/selectedSegementedButton");
            if (oFilterData.Fyear && sSelectedtable !== "notSubmitted") {
                let aFilters = [];
                aFilters.push(new Filter("Fyear", FilterOperator.EQ, oFilterData.Fyear));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.Pernr) {
                let aFilters = [];
                aFilters.push(new Filter("Pernr", FilterOperator.EQ, oFilterData.Pernr));
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
            var aCols = this.createColumnConfig();
            var oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: oBinding,
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
                type: EdmType.Date,
                inputFormat: "yyyymmdd",
                format: "dd.mm.yyyy"
            });
            aCols.push({
                label: this.getResourceBundle().getText("confirmedOn"),
                property: "ConfirmedOn",
                type: EdmType.Date,
                inputFormat: "yyyymmdd",
                format: "dd.mm.yyyy"
            });
            aCols.push({
                label: this.getResourceBundle().getText("status"),
                property: "StatusText"
            });
            return aCols;
        },
        onDownloadNotSubmitted: function () {
            var oTable = this.byId("idNotSubmittedTable");
            var oBinding = oTable.getBinding("items");
            var aCols = this.createColumnConfigNotSubmitted();
            var oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: oBinding,
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
        },
        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            var sValueHelpName = oEvent.getSource().sValueHelpName;
            var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);
            var oViewModel = this.getModel("viewModel");

            if (aTokens) {
                if (sValueHelpName == "EmployeeNumber") {
                    let Empid = aTokens[0].getCustomData()[0].getValue().Empid;
                    oViewModel.setProperty("/filterData/Pernr", Empid);
                }
            }
            this._oValueHelpDialog.close();
        },
        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },
        onValueHelpAfterClose: function () {
            this._oValueHelpDialog.destroy();
        },
        onValueHelpRequest: function (oEvent) {
            var oController = this;
            let oSource = oEvent.getSource();
            oController._currInputId = oSource.getId();
            oController._currSource = oSource;
            var sValueHelpName = oSource.data("valuehelp");
            var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);
            var aCols = oValueHelp.model.getData().cols;
            this._oBasicSearchField = new SearchField();
            this.loadFragment({
                name: oValueHelp.ValueHelpFragmentPath,
            }).then(function (oDialog) {

                this._oValueHelpDialog = oDialog;
                this.getView().addDependent(this._oValueHelpDialog);

                var oFilterBar = this._oValueHelpDialog.getFilterBar();
                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(this._oBasicSearchField);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchField.attachSearch(function (oEvent) {
                    oController.onFilterSearch(oEvent, sValueHelpName);
                });
                this._oBasicSearchField.setMaxLength(oValueHelp.maxLength);
                //this._oBasicSearchField.setPlaceholder("Please Provide "+sValueHelpName);
                this._configureProperties(this._oValueHelpDialog, sValueHelpName);

                this._oValueHelpDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(this.getModel());
                    if (oTable.bindRows) {
                        oTable.bindAggregation("rows", {
                            path: oValueHelp.bindingpath,
                            events: {
                                dataReceived: function () {
                                    oController._oValueHelpDialog.update();
                                }
                            }
                        });
                        for (var i = 0; i < aCols.length; i++) {
                            var oCol = aCols[i];
                            var oText = new Text({
                                text: {
                                    path: oCol.template
                                },
                                wrapping: false
                            });
                            var oColumn = new UIColumn({
                                label: new Label({
                                    text: oCol.label
                                }),
                                template: oText
                            });
                            oTable.addColumn(oColumn);
                        }
                    }

                    // For Mobile the default table is sap.m.Table

                    if (oTable.bindItems) {
                        // Bind items to the ODataModel and add columns
                        oTable.bindAggregation("items", {
                            path: oValueHelp.bindingpath,
                            template: new ColumnListItem({
                                //cells: [new Label({text: "{ProductCode}"}), new Label({text: "{ProductName}"})]
                                cells: [aCols.map(function (column) { return new Label({ text: "{" + column.template + "}" }) })]
                            }),
                            events: {
                                dataReceived: function () {
                                    oController._oValueHelpDialog.update();
                                }
                            }
                        });
                        for (var i = 0; i < aCols.length; i++) {
                            let labelText = aCols[i].label;
                            let tableColumn = new MColumn({ header: new Label({ text: labelText }) });
                            oTable.addColumn(tableColumn);
                        }
                    }
                    this._oValueHelpDialog.update();
                }.bind(this));


                //this._oValueHelpDialog.setTokens(oValueHelp.input.getTokens());
                this._oValueHelpDialog.open();

            }.bind(this));

        },
        fnGetValueHelpDetails: function (sValueHelp) {
            var oValueHelp = {};
            var sPath = "com.nhpc.zhrinstrdf10aprs1.";
            var sMultiInputValueHelpFragmentPath = "fragment.MultiInputValueHelp";
            var oLocationPath = '/ZHR_CDS_IT_EMPLOYEE_F4H';
            if (sValueHelp === "EmployeeNumber") {
                oValueHelp = {
                    "model": this.oEmployeeModel,
                    "ValueHelpFragmentPath": sPath + sMultiInputValueHelpFragmentPath,
                    "bindingpath": oLocationPath,
                    "input": this._currSource,
                    "maxLength": 100
                }
            }
            return oValueHelp;
        },
        _configureProperties: function (oValueHelp, sValueHelp) {
            oValueHelp.sValueHelpName = sValueHelp;
            if (sValueHelp === 'EmployeeNumber') {
                oValueHelp.setTitle("EmployeeNumber");
                oValueHelp.setKey("Empid");
                oValueHelp.setDescriptionKey("FullName");
                oValueHelp.setSupportMultiselect(false);
                oValueHelp.setSupportRanges(false);
            }
        },
        //Event triggerd on click of Go in Value help Search Filters              
        onFilterBarSearch: function (oEvent) {
            var sValueHelpName = oEvent.getSource().getParent().getParent().getParent().getParent().sValueHelpName;
            var sSearchQuery = this._oBasicSearchField.getValue()
            this._performVHSearch(sSearchQuery, sValueHelpName);
        },

        //Event triggered for Search bar in valuehelp of Filters                
        onFilterSearch: function (oEvent, valuehelpname) {
            let sValue = oEvent.getSource().getValue();
            this._performVHSearch(sValue, valuehelpname)
        },
        _performVHSearch: function (sValue, sValueHelpName) {
            if (sValueHelpName === "EmployeeNumber") {

                var oFilter = new Filter({
                    filters: [
                        new Filter({
                            path: "Empid",
                            operator: FilterOperator.Contains,
                            value1: sValue
                        }),
                        new Filter({
                            path: "FullName",
                            operator: FilterOperator.Contains,
                            value1: sValue
                        })
                    ],
                    and: false
                });

                this._filterTable(oFilter);
            }
        },
        _filterTable: function (oFilter) {
            var oValueHelpDialog = this._oValueHelpDialog;
            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }

                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oValueHelpDialog.update();
            });
        },
        onValueHelpChange: function (oEvent) {
            var sEmpId = oEvent.getParameter("value");
            var oInput = oEvent.getSource();
            if (!sEmpId) {
                this.getModel("filterModel").setProperty("/EmpId", "");
                return;
            }
            if (!/^\d+$/.test(sEmpId)) {
                oInput.setValue("");
                this.getModel("filterModel").setProperty("/EmpId", "");
                return;
            }
            this.getModel().read("/ZHR_CDS_IT_EMPLOYEE_F4H", {
                filters: [
                    new Filter(
                        "Empid",
                        FilterOperator.EQ,
                        sEmpId
                    )
                ],
                success: function (oData) {
                    if (oData.results.length > 0) {
                        this.getModel("viewModel")
                            .setProperty("/filterData/Pernr", oData.results[0].Empid);
                    } else {
                        oInput.setValue("");
                        this.getModel("viewModel")
                            .setProperty("/filterData/Pernr", "");
                    }
                }.bind(this),
                error: function () {
                    oInput.setValue("");
                    this.getModel("viewModel")
                        .setProperty("/filterData/Pernr", "");
                }.bind(this)
            });
        },

    });
});