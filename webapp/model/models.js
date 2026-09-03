sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            createViewModel: function () {
                let oViewModel = new JSONModel({
                    selectedYear:"",
                    filterData: {
                        Sno: "",
                        Pernr:"",
                        ConfirmedOn: "",
                        Status: ""
                    },
                    valueState: {
                        Noofsecuritiesprev: "None",
                        securityPurchased: "None",
                        Noofsecuritiesheld: "None",
                        Dpclientid: "None",
                        Transactiondate: "None",
                        Securitypurchased: "None",
                        Securitysold: "None",
                        Offmarket: "None",
                        selectedYear: "None"
                    },

                    valueStateText: {
                        Noofsecuritiesprev: "",
                        securityPurchased: "",
                        Noofsecuritiesheld: "",
                        Dpclientid: "",
                        Transactiondate: "",
                        Securitypurchased: "",
                        Securitysold: "",
                        Offmarket: "",
                        selectedYear: ""
                    },
                    editable:{
                        holdings:{
                            Noofsecuritiesprev: true
                        },
                        relatives:{
                            Noofsecuritiesprev: true
                        }
                    },
                    formDetails: {
                        Status: ""
                    },
                    dashboardCount : 0,
                    selectedTransactionHolding: {},
                    TransactionHolding: [],
                    selectedTransactionRelatives: {},
                    TransactionRelatives: [],
                    OtherDisclosures : [],
                    OtherDisclosuresLength : 0,
                    selectedTransactionHoldingIndex: -1,
                    selectedTransactionRelativesIndex: -1,
                    TransactionHoldingLength: 0,
                    TransactionRelativesLength: 0
                });
                oViewModel.setDefaultBindingMode("TwoWay");
                return oViewModel;
            }
        };

    });