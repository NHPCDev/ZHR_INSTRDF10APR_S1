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
    "sap/ui/core/format/NumberFormat",
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator, NumberFormat) => {
    "use strict";

    return BaseController.extend("com.nhpc.zhrinstrdf10aprs1.controller.Detail", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: async function (oEvent) {
            let oArgs = oEvent.getParameter("arguments");
            let sPernr = oArgs.Pernr;
            let sSelectedYear = oArgs.selectedYear;
            let oViewModel = this.getModel("viewModel");
            let oModel = this.getModel();
            oViewModel.setProperty("/selectedYear", sSelectedYear);
            oViewModel.setProperty("/nextYear", sSelectedYear.split("-")[1]);
            if (sPernr === "New") {
                oViewModel.setProperty("/TransactionHolding", []);
                oViewModel.setProperty("/TransactionRelatives", []);
                await this.setUndertakingText();
                await this.getDefaultEmployeeDetails(sPernr);
                let aPernr = oViewModel.getProperty("/formDetails/EmployeeId");
                await this.setFormDetails(aPernr, sSelectedYear);
                oViewModel.setProperty("/formDetails/Status", "New");
            } else {
                await this.setFormDetails(sPernr, sSelectedYear);
                await this.setUndertakingText();
                await this.getDefaultEmployeeDetails(sPernr);
                
            }
            let Filters = [];
            let sPernrName = oViewModel.getProperty("/formDetails/EmployeeId");
            if (sPernrName) {
                Filters = [
                    new Filter(
                        "Pernr",
                        FilterOperator.EQ,
                        sPernrName
                    )
                ]
            }
            oModel.read("/RelativeMasterSet", {
                filters: Filters,
                success: function (oData) {
                    let aRelativeData = (oData.results || []).map(function (oItem) {
                        return {
                            NameOfImmediateRelatives: oItem.NameOfImmediateRelatives,
                            PanOfImmediateRelative: oItem.PanOfImmediateRelative
                        };
                    });
                    oViewModel.setProperty("/relativeData", aRelativeData);
                }.bind(this),
                reject: function (oError) {
                    messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                        this.getRouter().navTo("RouteDashboard", {}, {}, true);
                    }.bind(this));
                    reject(oError);
                }.bind(this)
            })
        },

        setUndertakingText: async function () {
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let oFilter = new Filter("Preview", FilterOperator.EQ, "X");
            await new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                oModel.read("/Form10_textSet", {
                    // filters: [oFilter],
                    // urlParameters: {
                    //     "$expand": "Form9HeadToSelf,Form9HeadToRelatives"
                    // },
                    success: function (oData) {
                        BusyIndicator.hide();
                        if (oData.results.length === 0) {
                            messenger.error("No Data Found");
                            return;
                        }
                        oViewModel.setProperty("/formDetails/UndertakingText", oData.results[0].Undertaking);
                        resolve();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        reject(oError);
                    }
                });
            });
        },

        setFormDetails: async function (sPernr, sSelectedYear) {
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let oFilter = new Filter({
                filters: [
                    new Filter(
                        "Pernr",
                        FilterOperator.EQ,
                        sPernr
                    ),
                    new Filter(
                        "FormNo",
                        FilterOperator.EQ,
                        "FORM10"
                    ),
                    new Filter(
                        "ApproverFlag",
                        FilterOperator.EQ,
                        "R"
                    ),
                    new Filter(
                        "Fyear",
                        FilterOperator.EQ,
                        sSelectedYear
                    )
                ],
                and: true
            });
            await new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                oModel.read("/Form9headSet", {
                    filters: [oFilter],
                    urlParameters: {
                        "$expand": "Form9HeadToSelf,Form9HeadToRelatives"
                    },
                    success: function (oData) {
                        BusyIndicator.hide();
                        if (oData.results.length === 0) {
                            messenger.error("No Data Found");
                            return;
                        }
                        let x = "";
                        oData.results[0].Form9HeadToSelf.results.map(i => {
                            i.Noofsecuritiesprev = Number(i.Noofsecuritiesprev)?.toString();
                            i.Noofsecuritiesheld = Number(i.Noofsecuritiesheld)?.toString();
                            i.Securitypurchased = Number(i.Securitypurchased)?.toString();
                            i.Securitysold = Number(i.Securitysold)?.toString();
                            i.Securitypurchasedconso = Number(i.Securitypurchasedconso)?.toString();
                            i.Securitysoldconso = Number(i.Securitysoldconso)?.toString();
                            if (!x) {
                                x = i.Transactiondate;
                            }
                        });
                        oData.results[0].Form9HeadToRelatives.results.map(i => {
                            i.Noofsecuritiesprev = Number(i.Noofsecuritiesprev)?.toString();
                            i.Noofsecuritiesheld = Number(i.Noofsecuritiesheld)?.toString();
                            i.Securitypurchased = Number(i.Securitypurchased)?.toString();
                            i.Securitysold = Number(i.Securitysold)?.toString();
                            i.Securitypurchasedconso = Number(i.Securitypurchasedconso)?.toString();
                            i.Securitysoldconso = Number(i.Securitysoldconso)?.toString();
                            if (!x) {
                                x = i.Transactiondate;
                            }
                        });
                        // let iYear = parseInt(x.substring(0, 4), 10);
                        // let sFinancialYear = iYear + "-" + (iYear + 1);
                        // let sNextYear = (iYear + 1).toString();
                        // oViewModel.setProperty("/formDetails/financialYear", sFinancialYear);
                        // oViewModel.setProperty("/formDetails/nextYear", sNextYear);
                        oViewModel.setProperty("/formDetails/Fromdate", oData.results[0].Fromdate);
                        oViewModel.setProperty("/formDetails/Todate", oData.results[0].Todate);
                        oViewModel.setProperty("/formDetails/DateOfJoining", oData.results[0].DateOfJoiningDP);
                        oViewModel.setProperty("/TransactionHolding", oData.results[0].Form9HeadToSelf.results);
                        oViewModel.setProperty("/TransactionRelatives", oData.results[0].Form9HeadToRelatives.results);
                        oViewModel.setProperty("/TransactionHoldingEquity", oData.results[0].Form9HeadToSelf.results.filter(i => i.NatureOfSecurity === "Equity"));
                        oViewModel.setProperty("/TransactionHoldingBond", oData.results[0].Form9HeadToSelf.results.filter(i => i.NatureOfSecurity === "Bonds"));
                        oViewModel.setProperty("/TransactionRelativesBond", oData.results[0].Form9HeadToRelatives.results.filter(i => i.NatureOfSecurity === "Bonds"));
                        oViewModel.setProperty("/TransactionRelativesEquity", oData.results[0].Form9HeadToRelatives.results.filter(i => i.NatureOfSecurity === "Equity"));
                        oViewModel.setProperty("/formDetails/Status", oData.results[0].Status);
                        oViewModel.setProperty("/formDetails/UndertakingText", oData.results[0].UndertakingText);
                        oViewModel.setProperty("/formDetails/Designation", oData.results[0].Designation);
                        let bFilters = [
                            new Filter(
                                "Pernr",
                                FilterOperator.EQ,
                                oData.results[0].PERNR
                            )
                        ];
                        new Promise((resolve, reject) => {
                            oModel.read("/DPregistrationSet", {
                                filters: bFilters,
                                success: function (aData) {
                                    oViewModel.setProperty("/formDetails/DateOfJoining", aData.results[0].Designateddate);
                                    resolve();
                                },
                                error: function (oError) {
                                    reject(oError);
                                }
                            })
                        });
                        resolve();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        reject(oError);
                    }
                });
            });
            let aFilters = [new Filter("Pernr", FilterOperator.EQ, sPernr)];
            await new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                oModel.read("/RelativeMasterSet", {
                    filters: aFilters,
                    success: function (oData) {
                        BusyIndicator.hide();
                        oViewModel.setProperty("/OtherDisclosures", oData.results);
                        oViewModel.setProperty("/OtherDisclosuresLength", oData.results.length);
                        resolve();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        reject();
                    }
                });
            });
        },
        getDefaultEmployeeDetails: function (sPernr) {
            return new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                let oModel = this.getModel(),
                    oViewModel = this.getModel("viewModel");
                let aFilters = [
                    new Filter(
                        "DFLT",
                        FilterOperator.EQ,
                        "X"
                    )
                ];
                if (sPernr !== "New") {
                    aFilters = [
                        new Filter(
                            "PERNR",
                            FilterOperator.EQ,
                            sPernr
                        )
                    ];
                }
                oModel.read("/ZFI_GH_USER_F4", {
                    filters: aFilters,
                    success: async function (oResp) {
                        BusyIndicator.hide();
                        if (oResp.results && oResp.results.length > 0) {
                            oViewModel.setProperty("/formDetails/EmployeeId", oResp.results[0].PERNR);
                            oViewModel.setProperty("/formDetails/EmployeeName", oResp.results[0].ENAME);
                            oViewModel.setProperty("/formDetails/CompanyCode", oResp.results[0].BUKRS);
                            oViewModel.setProperty("/formDetails/EmployeeGrade", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrp", oResp.results[0].SUB_GROUP);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrpText", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/PersonnelSubArea", oResp.results[0].WERKS);
                            oViewModel.setProperty("/formDetails/PersonnelSubAreaText", oResp.results[0].PLANT);
                            oViewModel.setProperty("/formDetails/EmployeeDepartment", `${oResp.results[0].DEP_CODE} - ${oResp.results[0].DEP}`);
                            oViewModel.setProperty("/formDetails/PositionText", oResp.results[0].DESIG);
                            oViewModel.setProperty("/formDetails/USRID", oResp.results[0].USRID);
                            oViewModel.setProperty("/formDetails/MOBILE", oResp.results[0].MOBILE);
                            oViewModel.setProperty("/formDetails/EMAIL", oResp.results[0].EMAIL);
                            oViewModel.setProperty("/formDetails/DATE_JOIN", oResp.results[0].DATE_JOIN);
                        }
                        await this._getHistoryWithRemarksData(oResp.results[0].PERNR);
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        }.bind(this));
                        reject(oError);
                    }.bind(this)
                });
            });
        },

        _getHistoryWithRemarksData: function (Pernr) {
            var oModel = this.getModel();
            var oVM = this.getModel("viewModel");
            var aFilters = [
                new Filter("Pernr", FilterOperator.EQ, Pernr),
                new Filter("FormNo", FilterOperator.EQ, "FORM10")
            ];

            oModel.read("/RemarkHistorySet", {
                filters: aFilters,
                success: function (oData) {
                    oVM.setProperty("/History", oData.results);
                    console.log("History Data", oData.results);
                }.bind(this),

                error: function () {
                    MessageBox.error("unableToFetchApplicationDetails");
                }
            });
        },


        resetValueStates: function () {
            let oViewModel = this.getModel("viewModel");

            oViewModel.setProperty("/valueState/Noofsecuritiesprev", "None");
            oViewModel.setProperty("/valueState/securityPurchased", "None");
            oViewModel.setProperty("/valueState/Noofsecuritiesheld", "None");
            oViewModel.setProperty("/valueState/Dpclientid", "None");
            oViewModel.setProperty("/valueState/Transactiondate", "None");
            oViewModel.setProperty("/valueState/Securitypurchased", "None");
            oViewModel.setProperty("/valueState/Securitysold", "None");
            oViewModel.setProperty("/valueState/Offmarket", "None");
            oViewModel.setProperty("/valueState/Relativename", "None");
            oViewModel.setProperty("/valueState/Relativetype", "None");
            oViewModel.setProperty("/valueState/NatureOfSecurity", "None");

            oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", null);
            oViewModel.setProperty("/valueStateText/securityPurchased", null);
            oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", null);
            oViewModel.setProperty("/valueStateText/Dpclientid", null);
            oViewModel.setProperty("/valueStateText/Transactiondate", null);
            oViewModel.setProperty("/valueStateText/Securitypurchased", null);
            oViewModel.setProperty("/valueStateText/Securitysold", null);
            oViewModel.setProperty("/valueStateText/Offmarket", null);
            oViewModel.setProperty("/valueStateText/Relativename", null);
            oViewModel.setProperty("/valueStateText/Relativetype", null);
            oViewModel.setProperty("/valueStateText/NatureOfSecurity", null);
        },

        onAddHoldingsBond: function(){
            this._securityType = "Bonds";
            this.onAddTransactionHoldingDetails();
        },

        onAddHoldingsEquity: function(){
            this._securityType = "Equity";
            this.onAddTransactionHoldingDetails();
        },

        onAddTransactionHoldingDetails: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            let oModel = this.getModel();
            oViewModel.setProperty("/selectedTransactionHolding", {});
            oViewModel.setProperty("/selectedTransactionHoldingIndex", null);
            oViewModel.setProperty("/selectedTransactionHolding/NatureOfSecurity", this._securityType);
            let sTableData;
            if(this._securityType === "Bonds"){
                sTableData = oViewModel.getProperty("/TransactionHoldingBond")
            } else {
                sTableData = oViewModel.getProperty("/TransactionHoldingEquity")
            }
            if (sTableData.length > 0) {
                let sLastRow = sTableData[sTableData.length - 1];
                let sNoOfSecuritiesPrevHeld = sLastRow.Noofsecuritiesheld;
                oViewModel.setProperty("/selectedTransactionHolding/Noofsecuritiesprev", sNoOfSecuritiesPrevHeld);
                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", false);
            } else {
                let aFilters = [new Filter("SelfFlag", FilterOperator.EQ, "SELF"), new Filter("Pernr", FilterOperator.EQ, oViewModel.getProperty("/formDetails/EmployeeId"))]
                await new Promise((resolve, reject) => {
                    oModel.read("/PreviousSecuritiesSet", {
                        filters: aFilters,
                        success: function (oData) {
                            let securities = oData.results[0].NoOfSecuritiesheld;
                            if (oData.results[0].NoOfSecuritiesheld !== "NO") {
                                oViewModel.setProperty("/selectedTransactionHolding/Noofsecuritiesprev", Number(securities)?.toString());
                                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", false);
                            } else {
                                oViewModel.setProperty("/selectedTransactionHolding/Noofsecuritiesprev", "");
                                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", true);
                            }

                            resolve()
                        },
                        reject: function (oError) {
                            oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", true);
                            reject()
                        }
                    })
                });
            }
            if (!this.oAddHoldingDialog) {
                this.oAddHoldingDialog = await Fragment.load({
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.TransactionHoldingsPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddHoldingDialog);
            }
            this.oAddHoldingDialog.open();
        },

        onEditTransactionHoldingDetails: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            let oTable = this.byId("idTransactionHoldingTable");
            let sSelectedItem = oTable.getSelectedItem();
            if (!sSelectedItem) {
                messenger.error(this.getResourceBundle().getText("selectRowToEdit"));
                return;
            }
            let sBindingContext = sSelectedItem.getBindingContext("viewModel");
            let sPath = sBindingContext.getPath();
            let iIndex = parseInt(sPath.split("/").pop(), 10);
            if (iIndex === 0) {
                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", true);
            }
            let oResourceBundle = this.getResourceBundle();
            let sData = structuredClone(sBindingContext.getObject());
            oViewModel.setProperty("/selectedTransactionHolding", sData);
            if (!this.oAddHoldingDialog) {
                this.oAddHoldingDialog = await Fragment.load({
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.TransactionHoldingsPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddHoldingDialog);
            }
            this.oAddHoldingDialog.open();
        },

        onDeleteTransactionHoldingDetails: function () {
            let oTable = this.byId("idTransactionHoldingTable");
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            let oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(oResourceBundle.getText("selectRowToDelete"));
                return;
            }
            let oContext = oSelectedItem.getBindingContext("viewModel");
            let sIndex = oContext.getPath().split("/").pop();
            let sTransactionHoldingTable = oViewModel.getProperty("/TransactionHolding");
            sTransactionHoldingTable.splice(sIndex, 1);
            oViewModel.setProperty("/TransactionHolding", sTransactionHoldingTable);
            messenger.success(oResourceBundle.getText("transactionHoldingDetailsDeleted"));
        },

        onSaveTransactionHoldingDetails: function () {
            let oViewModel = this.getModel("viewModel");
            let oSecurityDetails = oViewModel.getProperty("/selectedTransactionHolding");
            let oTableData = [];
            if(this._securityType === "Bonds"){
                oTableData = oViewModel.getProperty("/TransactionHoldingBond")
            } else {
                oTableData = oViewModel.getProperty("/TransactionHoldingEquity")
            }
            let isEdit = oViewModel.getProperty("/selectedTransactionHoldingIndex") !== null;
            let isValid = this.checkTransactionHoldingsDetailsValidation(oSecurityDetails);
            const oDate = new Date();
            const sDate =
                oDate.getFullYear().toString() +
                String(oDate.getMonth() + 1).padStart(2, "0") +
                String(oDate.getDate()).padStart(2, "0");
            oViewModel.setProperty("/selectedTransactionHolding/Confirmedon", sDate);
            oViewModel.setProperty("/selectedTransactionHolding/UUID", crypto.randomUUID());
            if (!isValid) {
                messenger.error(this.getResourceBundle().getText("fillAllRequiredFields"));
                return;
            }
            if (isEdit) {
                let index = oViewModel.getProperty("/selectedTransactionHoldingIndex");
                oTableData[index] = oSecurityDetails;
            } else {
                oTableData.push(oSecurityDetails);
            }
            if(this._securityType === "Bonds"){
                oViewModel.setProperty("/TransactionHoldingBond", oTableData);
            } else {
                oViewModel.setProperty("/TransactionHoldingEquity", oTableData);
            }            
            oViewModel.setProperty("/selectedTransactionHoldingIndex", {});
            this.oAddHoldingDialog.close();
        },

        onCancelTransactionHoldingDetails: function () {
            this.oAddHoldingDialog.close();
        },

        checkTransactionHoldingsDetailsValidation: function (oSecurityDetails) {
            let oViewModel = this.getModel("viewModel");
            let errors = [];
            if (!oSecurityDetails.NatureOfSecurity) {
                oViewModel.setProperty("/valueState/NatureOfSecurity", ValueState.Error);
                oViewModel.setProperty("/valueStateText/NatureOfSecurity", this.getResourceBundle().getText("NatureOfSecurityRequired"));
                errors.push(this.getResourceBundle().getText("NatureOfSecurityRequired"));
            } else {
                oViewModel.setProperty("/valueState/NatureOfSecurity", ValueState.None);
                oViewModel.setProperty("/valueStateText/NatureOfSecurity", null);
            }
            if (!oSecurityDetails.Noofsecuritiesprev) {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", null);
            }
            if (!oSecurityDetails.TransactionType) {
                oViewModel.setProperty("/valueState/TransactionType", ValueState.Error);
                oViewModel.setProperty("/valueStateText/TransactionType", this.getResourceBundle().getText("securitypurchasedRequired"));
                errors.push(this.getResourceBundle().getText("securitypurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/securityPurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/securityPurchased", null);
            }
            if (!oSecurityDetails.Noofsecuritiesheld) {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", null);
            }
            if (!oSecurityDetails.Dpclientid) {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Dpclientid", this.getResourceBundle().getText("DpclientidRequired"));
                errors.push(this.getResourceBundle().getText("DpclientidRequired"));
            } else {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.None);
                oViewModel.setProperty("/valueStateText/Dpclientid", null);
            }
            if (!oSecurityDetails.Transactiondate) {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Transactiondate", this.getResourceBundle().getText("TransactiondateRequired"));
                errors.push(this.getResourceBundle().getText("TransactiondateRequired"));
            } else {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.None);
                oViewModel.setProperty("/valueStateText/Transactiondate", null);
            }
            if (!oSecurityDetails.Securitypurchased && oSecurityDetails.securityPurchased === "Bought") {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitypurchased", this.getResourceBundle().getText("SecurityPurchasedRequired"));
                errors.push(this.getResourceBundle().getText("SecuritypurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitypurchased", null);
            }
            if (!oSecurityDetails.Securitysold && oSecurityDetails.securityPurchased === "Sold") {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitysold", this.getResourceBundle().getText("SecuritysoldRequired"));
                errors.push(this.getResourceBundle().getText("SecuritysoldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitysold", null);
            }
            if (!oSecurityDetails.Offmarket) {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Offmarket", this.getResourceBundle().getText("OffmarketRequired"));
                errors.push(this.getResourceBundle().getText("OffmarketRequired"));
            } else {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.None);
                oViewModel.setProperty("/valueStateText/Offmarket", null);
            }
            return errors.length === 0;
        },

        onTransactionHoldingBondTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            let sTransactionHoldings = oViewModel.getProperty("/TransactionHoldingBond") || [];
            let sTransactionHoldingsLength = sTransactionHoldings.length;
            oViewModel.setProperty("/TransactionHoldingBondLength", sTransactionHoldingsLength);
        },

        onTransactionHoldingEquityTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            let sTransactionHoldings = oViewModel.getProperty("/TransactionHoldingEquity") || [];
            let sTransactionHoldingsLength = sTransactionHoldings.length;
            oViewModel.setProperty("/TransactionHoldingEquityLength", sTransactionHoldingsLength);
        },

        onAddRelativesBond: function(){
            this._securityType = "Bonds";
            this.onAddSecurityDetailsRelatives();
        },

        onAddRelativesEquity: function(){
            this._securityType = "Equity";
            this.onAddSecurityDetailsRelatives();
        },

        onAddSecurityDetailsRelatives: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/selectedTransactionRelatives", {});
            oViewModel.setProperty("/selectedTransactionRelativesIndex", null);
            oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", true);
            oViewModel.setProperty("/selectedTransactionRelatives/NatureOfSecurity",this._securityType)
            if (!this.oAddRelativeDialog) {
                this.oAddRelativeDialog = await Fragment.load({
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.TransactionRelativesPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddRelativeDialog);
            }
            this.oAddRelativeDialog.open();
        },

        onEditSecurityDetailsRelatives: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            let oTable = this.byId("idTransactionRelativeTable");
            let oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(this.getResourceBundle().getText("selectRowToEdit"));
                return;
            }
            let oContext = oSelectedItem.getBindingContext("viewModel");
            let sPath = oContext.getPath();
            let iIndex = parseInt(sPath.split("/").pop(), 10);
            let oData = structuredClone(oContext.getObject());
            let aData = oViewModel.getProperty("/TransactionRelatives") || [];
            let bFirstOccurrence = true;
            for (let i = 0; i < iIndex; i++) {
                if (aData[i].Relativename === oData.Relativename) {
                    bFirstOccurrence = false;
                    break;
                }
            }
            oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", bFirstOccurrence);
            oViewModel.setProperty("/selectedTransactionRelatives", oData);
            if (!this.oAddRelativeDialog) {
                this.oAddRelativeDialog = await Fragment.load({
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.TransactionRelativesPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddRelativeDialog);
            }
            this.oAddRelativeDialog.open();
        },

        onDeleteSecurityDetailsRelatives: function () {
            let oTable = this.byId("idTransactionRelativeTable");
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            let oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(oResourceBundle.getText("selectRowToDelete"));
                return;
            }
            let oContext = oSelectedItem.getBindingContext("viewModel");
            let sIndex = oContext.getPath().split("/").pop();
            let sTransactionHoldingTable = oViewModel.getProperty("/TransactionRelatives");
            sTransactionHoldingTable.splice(sIndex, 1);
            oViewModel.setProperty("/TransactionRelatives", sTransactionHoldingTable);
            messenger.success(oResourceBundle.getText("transactionRelativeDetailsDeleted"));
        },

        onSaveTransactionRelativeDetails: function () {
            let oViewModel = this.getModel("viewModel");
            let oSecurityDetails = oViewModel.getProperty("/selectedTransactionRelatives");
            let oTableData = [];
            if(this._securityType === "Bonds"){
                oTableData = oViewModel.getProperty("/TransactionRelativesBond")
            } else {
                oTableData = oViewModel.getProperty("/TransactionRelativesEquity")
            }
            let isEdit = oViewModel.getProperty("/selectedTransactionRelativesIndex") !== null;
            let isValid = this.checkTransactionRelativesDetailsValidation(oSecurityDetails);
            const oDate = new Date();
            const sDate =
                oDate.getFullYear().toString() +
                String(oDate.getMonth() + 1).padStart(2, "0") +
                String(oDate.getDate()).padStart(2, "0");
            oViewModel.setProperty("/selectedTransactionRelatives/Createdon", sDate);
            oViewModel.setProperty("/selectedTransactionRelatives/UUID", crypto.randomUUID());
            if (!isValid) {
                messenger.error(this.getResourceBundle().getText("fillAllRequiredFields"));
                return;
            }
            if (isEdit) {
                let index = oViewModel.getProperty("/selectedTransactionRelativesIndex");
                oTableData[index] = oSecurityDetails;
            } else {
                oTableData.push(oSecurityDetails);
            }
            if(this._securityType === "Bonds"){
                oViewModel.setProperty("/TransactionRelativesBond", oTableData);
            } else {
                oViewModel.setProperty("/TransactionRelativesEquity", oTableData);
            }  
            oViewModel.setProperty("/selectedTransactionRelativesIndex", {});
            this.updateDate();
            this.oAddRelativeDialog.close();
        },

        onCancelTransactionRelativeDetails: function () {
            this.oAddRelativeDialog.close();
        },

        checkTransactionRelativesDetailsValidation: function (oSecurityDetails) {
            let oViewModel = this.getModel("viewModel");
            let errors = [];
            if (!oSecurityDetails.NatureOfSecurity) {
                oViewModel.setProperty("/valueState/NatureOfSecurity", ValueState.Error);
                oViewModel.setProperty("/valueStateText/NatureOfSecurity", this.getResourceBundle().getText("NatureOfSecurityRequired"));
                errors.push(this.getResourceBundle().getText("NatureOfSecurityRequired"));
            } else {
                oViewModel.setProperty("/valueState/NatureOfSecurity", ValueState.None);
                oViewModel.setProperty("/valueStateText/NatureOfSecurity", null);
            }
            if (!oSecurityDetails.Relativename) {
                oViewModel.setProperty("/valueState/Relativename", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Relativename", this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
                errors.push(this.getResourceBundle().getText("RelativenameRequired"));
            } else {
                oViewModel.setProperty("/valueState/Relativename", ValueState.None);
                oViewModel.setProperty("/valueStateText/Relativename", null);
            }
            if (!oSecurityDetails.Noofsecuritiesprev) {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", null);
            }
            if (!oSecurityDetails.TransactionType) {
                oViewModel.setProperty("/valueState/TransactionType", ValueState.Error);
                oViewModel.setProperty("/valueStateText/TransactionType", this.getResourceBundle().getText("securitypurchasedRequired"));
                errors.push(this.getResourceBundle().getText("securitypurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/securityPurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/securityPurchased", null);
            }
            if (!oSecurityDetails.Noofsecuritiesheld) {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", null);
            }
            if (!oSecurityDetails.Dpclientid) {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Dpclientid", this.getResourceBundle().getText("DpclientidRequired"));
                errors.push(this.getResourceBundle().getText("DpclientidRequired"));
            } else {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.None);
                oViewModel.setProperty("/valueStateText/Dpclientid", null);
            }
            if (!oSecurityDetails.Relativetype) {
                oViewModel.setProperty("/valueState/Relativetype", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Relativetype", this.getResourceBundle().getText("TransactiondateRequired"));
                errors.push(this.getResourceBundle().getText("RelativetypeRequired"));
            } else {
                oViewModel.setProperty("/valueState/Relativetype", ValueState.None);
                oViewModel.setProperty("/valueStateText/Relativetype", null);
            }
            if (!oSecurityDetails.Transactiondate) {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Transactiondate", this.getResourceBundle().getText("TransactiondateRequired"));
                errors.push(this.getResourceBundle().getText("TransactiondateRequired"));
            } else {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.None);
                oViewModel.setProperty("/valueStateText/Transactiondate", null);
            }
            if (!oSecurityDetails.Securitypurchased && oSecurityDetails.securityPurchased === "Bought") {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitypurchased", this.getResourceBundle().getText("SecurityPurchasedRequired"));
                errors.push(this.getResourceBundle().getText("SecuritypurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitypurchased", null);
            }
            if (!oSecurityDetails.Securitysold && oSecurityDetails.securityPurchased === "Sold") {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitysold", this.getResourceBundle().getText("SecuritysoldRequired"));
                errors.push(this.getResourceBundle().getText("SecuritysoldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitysold", null);
            }
            if (!oSecurityDetails.Offmarket) {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Offmarket", this.getResourceBundle().getText("OffmarketRequired"));
                errors.push(this.getResourceBundle().getText("OffmarketRequired"));
            } else {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.None);
                oViewModel.setProperty("/valueStateText/Offmarket", null);
            }
            return errors.length === 0;
        },
        onTransactionRelativeBondTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            let sTransactionHoldings = oViewModel.getProperty("/TransactionRelativesBond") || [];
            let sTransactionHoldingsLength = sTransactionHoldings.length;
            oViewModel.setProperty("/TransactionRelativesBondLength", sTransactionHoldingsLength);
        },
        onTransactionRelativeEquityTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            let sTransactionHoldings = oViewModel.getProperty("/TransactionRelativesEquity") || [];
            let sTransactionHoldingsLength = sTransactionHoldings.length;
            oViewModel.setProperty("/TransactionRelativesEquityLength", sTransactionHoldingsLength);
        },
        onRelativeChange: async function (oEvent) {
            await this.onComboboxChange(oEvent);
            let that = this;
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let sNatureOfSecurity = oViewModel.getProperty("/selectedTransactionRelatives/NatureOfSecurity")
            let sRelative = oEvent.getSource().getSelectedKey().trim();
            if (!sNatureOfSecurity || !sRelative) {
                return;
            }
            let aData = oViewModel.getProperty("/TransactionRelatives") || [];
            let oLatestRecord = null;
            for (let i = aData.length - 1; i >= 0; i--) {
                if (aData[i].Relativename === sRelative) {
                    oLatestRecord = aData[i];
                    break;
                }
            }
            var oData = oEvent.getSource().getSelectedItem()?.getBindingContext("viewModel").getObject();
            oViewModel.setProperty("/selectedTransactionRelatives/Relativetype", oData.RelationOfImmediateRelative);
            // oViewModel.setProperty("/selectedTransactionRelatives/Relativeno", oData.RelativeType);
            oViewModel.setProperty("/selectedTransactionRelatives/PanNumber", oData.PanOfImmediateRelative);
            if (sRelative === "Others") {
                oViewModel.setProperty("/editable/RelativeType", true);
            } else {
                oViewModel.setProperty("/editable/RelativeType", false);
            }
            if (oLatestRecord) {
                oViewModel.setProperty("/selectedTransactionRelatives/Noofsecuritiesprev", oLatestRecord.Noofsecuritiesheld);
                oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", false);
            } else {
                let aFilters = [new Filter("SelfFlag", FilterOperator.EQ, "RELATIVE"), new Filter("Pernr", FilterOperator.EQ, oViewModel.getProperty("/formDetails/EmployeeId")),
                new Filter("RelativeType", FilterOperator.EQ, oData.RelationOfImmediateRelative), new Filter("NatureOfSecurity", FilterOperator.EQ, oViewModel.getProperty("/selectedTransactionRelatives/NatureOfSecurity")),
                new Filter("PanNumber", FilterOperator.EQ, oData.PanOfImmediateRelative)
                ]
                await new Promise((resolve, reject) => {
                    BusyIndicator.show(0);
                    oModel.read("/PreviousSecuritiesSet", {
                        filters: aFilters,
                        success: function (oData) {
                            if (oData.results[0].NoOfSecuritiesheld !== "NO") {
                                let securities = oData.results[0].NoOfSecuritiesheld;
                                oViewModel.setProperty("/selectedTransactionRelatives/Noofsecuritiesprev", Number(securities).toString());
                                oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", false);
                            } else {
                                oViewModel.setProperty("/selectedTransactionRelatives/Noofsecuritiesprev", null);
                                oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", true);
                            }
                            that.updateNoOfSecuirites(oEvent);
                            BusyIndicator.hide();
                            resolve()
                        },
                        reject: function (oError) {
                            BusyIndicator.hide();
                            oViewModel.setProperty("/selectedTransactionRelatives/Noofsecuritiesprev", null);
                            oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", true);
                            reject()
                        }
                    })
                });
            }
        },

        updateDate: function () {
            let oViewModel = this.getModel("viewModel");

            let aHoldingsData = oViewModel.getProperty("/TransactionHolding") || [];
            let aRelativesData = oViewModel.getProperty("/TransactionRelatives") || [];

            let aAllData = [...aHoldingsData, ...aRelativesData];
            let aDates = aAllData
                .map(function (oItem) {
                    return oItem.Transactiondate;
                })
                .filter(function (sDate) {
                    return !!sDate;
                });

            if (aDates.length === 0) {
                oViewModel.setProperty("/formDetails/Fromdate", "");
                oViewModel.setProperty("/formDetails/Todate", "");
                return;
            }

            let sFromDate = aDates.reduce(function (min, date) {
                return date < min ? date : min;
            });

            let sToDate = aDates.reduce(function (max, date) {
                return date > max ? date : max;
            });

            oViewModel.setProperty("/formDetails/Fromdate", sFromDate);
            oViewModel.setProperty("/formDetails/Todate", sToDate);
        },

        handleSaveBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_SAVE_REQUEST"),
                aErrors = [],
                oViewModel = this.getModel("viewModel"),
                oFormDetails = oViewModel.getProperty("/formDetails");
            var oModel = this.getModel();
            messenger.confirm(sTitle, sText, "Confirm", null, function () {
                BusyIndicator.show(0);
                this.sActionFlag = "Draft";
                let oPayload = this.createRequestPayload();
                oModel.create("/Form9headSet", oPayload, {
                    success: function (oResp) {
                        BusyIndicator.hide();
                        messenger.success(oResourceBundle.getText("FinalSaveMsg", oResp.Fyear), () => {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        });
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }.bind(this)
                });
            }.bind(this));
        },
        handleSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST"),
                bProceed = this.validateSubmitRequestDetails();
            var oModel = this.getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    this.sActionFlag = "Confirmed";
                    let oPayload = this.createRequestPayload();
                    oModel.create("/Form9headSet", oPayload, {
                        success: function (oResp) {
                            BusyIndicator.hide();
                            messenger.success(oResourceBundle.getText("FinalSuccessMsg", oResp.Fyear), () => {
                                this.getRouter().navTo("RouteDashboard", {}, {}, true);
                            });
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },
        validateSubmitRequestDetails: function () {
            let oResourceBundle = this.getResourceBundle();
            let bProceed = true;
            let oViewModel = this.getModel("viewModel");
            let aHoldingsDataBond = oViewModel.getProperty("/TransactionHoldingBond") || [];
            let aRelativesDataBond = oViewModel.getProperty("/TransactionRelativesBond") || [];
            let aHoldingsDataEquity = oViewModel.getProperty("/TransactionHoldingEquity") || [];
            let aRelativesDataEquity = oViewModel.getProperty("/TransactionRelativesEquity") || [];
            if (aHoldingsDataBond.length === 0 && aRelativesDataBond.length === 0 && aHoldingsDataEquity.length === 0 && aRelativesDataEquity.length === 0) {
                bProceed = false;
                messenger.error(oResourceBundle.getText("atLeastOneLineItemErrorMsg"));
            }
            return bProceed;
        },
        createRequestPayload: function () {
            var oViewModel = this.getModel("viewModel"),
                oFormDetails = oViewModel.getProperty("/formDetails"),
                oHoldingsData = [...oViewModel.getProperty("/TransactionHoldingBond"), ...oViewModel.getProperty("/TransactionHoldingEquity")],
                oRelativesData = [...oViewModel.getProperty("/TransactionRelativesBond"), ...oViewModel.getProperty("/TransactionRelativesEquity")];
            oHoldingsData.forEach(i => delete i.securityPurchased);
            oRelativesData.forEach(i => delete i.securityPurchased);
            const sFyear = oViewModel.getProperty("/selectedYear");
            const iStartYear = parseInt(sFyear.split("-")[1], 10);
            const oToday = new Date();
            oToday.setHours(0, 0, 0, 0);
            const oApril30 = new Date(iStartYear, 3, 30);
            oApril30.setHours(0, 0, 0, 0);
            let sStatus = "No";
            if (oToday > oApril30) {
                sStatus = "Delayed";
            }
            var oPayload = {
                "Pernr": oFormDetails.EmployeeId,
                "EmployeeName": oFormDetails.EmployeeName,
                "Department": oFormDetails.EmployeeDepartment,
                "DateOfJoiningDP": oFormDetails.DateOfJoining,
                Status: this.sActionFlag,
                Form9HeadToSelf: oHoldingsData,
                Form9HeadToRelatives: oRelativesData,
                Fromdate: oFormDetails.Fromdate,
                Todate: oFormDetails.Todate,
                FormNo: "FORM10",
                Fyear: sFyear,
                Delayed: sStatus
            };
            let sNo = oViewModel.getProperty("/sNo");
            if (sNo) {
                oPayload.Sno = sNo
            }
            oPayload.Rejectionremarks = oFormDetails.Remarks;
            return oPayload;
        },
        handlePreviewBtnPress: async function () {
            let oView = this.getView();
            if (!this.oPreviewDialog) {
                this.oPreviewDialog = await Fragment.load({
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.Form10Preview",
                    controller: this
                });
                oView.addDependent(this.oPreviewDialog);
            }
            this.oPreviewDialog.open();
        },
        onForm10PreviewCancel: function () {
            this.oPreviewDialog.close();
        },
        onDecisionSubmitReturn: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_RETURN_REQUEST");
            var oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let isMandatoryFilled = oViewModel.getProperty("/formDetails/Remarks");
            if (!isMandatoryFilled || isMandatoryFilled?.trim() === "") {
                oViewModel.setProperty("/valueState/Remarks", "Error");
                oViewModel.setProperty("/valueStateText/Remarks", oResourceBundle.getText("remarkErrorMsg"));
                return;
            } else {
                oViewModel.setProperty("/valueState/Remarks", "None");
                oViewModel.setProperty("/valueStateText/Remarks", oResourceBundle.getText("remarkErrorMsg"));
            }
            messenger.confirm(sTitle, sText, "Confirm", null, function () {
                BusyIndicator.show(0);
                this.sActionFlag = "Returned";
                let oPayload = this.createRequestPayload();
                oModel.create("/Form9headSet", oPayload, {
                    success: function (oResp) {
                        BusyIndicator.hide();
                        messenger.success(oResourceBundle.getText("FinalReturnMsg", oResp.Fyear), () => {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        });
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }.bind(this)
                });
            }.bind(this));

        },
        onDecisionSubmit: function (oEvent) {
            const sDecision = this.getModel("viewModel").getProperty("/decision");
            const fnHandler = sDecision === "Approve"
                ? this.onDecisionSubmitApprove
                : this.onDecisionSubmitReturn;

            fnHandler.call(this, oEvent);
        },
        handleReturnBtnPress: async function () {
            this.getModel("viewModel").setProperty("/decision","Return");
            if (!this._oRemarksDialog) {
                this._oRemarksDialog = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinstrdf10aprs1.fragment.Remarks",
                    controller: this
                });
                this.getView().addDependent(this._oRemarksDialog);
            }
            this._oRemarksDialog.open();
        },
        onDecisionCancel: function () {
            this._oRemarksDialog.close();
        },
    });
});