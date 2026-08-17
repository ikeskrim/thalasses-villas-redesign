var myApp = angular.module('frontendApp', ['vcRecaptcha']);

myApp.config(["$interpolateProvider", function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
}]);
myApp.filter('htmlToPlaintext', function () {
    return function (text) {
        return angular.element(text).text();
    }
}
);
myApp.filter("translate", function () { // register new filter
    var result = '';
    return function (input, locale, field) { // filter arguments
        result = '';
        angular.forEach(input, function (value, key) {
            if (value.lang.langCode.toLowerCase() == locale.toLowerCase()) {
                result = value[field];
            } else if (result == '') {
                result = value[field];
            }
        });
        return result;
    };
});
myApp.directive('stringToNumber', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return '' + value;
            });
            ngModel.$formatters.push(function (value) {
                return parseFloat(value);
            });
        }
    };
});
myApp.filter('range', function () {
    return function (input, total) {
        total = parseInt(total);

        for (var i = 0; i < total; i++) {
            input.push(i);
        }
        return input;
    };
});


myApp.service('endpoints', ["$http", function ($http) {
    return {
        newsletterSubscribe: function (data) {
            var promise = $http.post('/api/admin/frontend/page/' + data.page_id + '/newsletter/subscribe', data).then(function (response) {
                return response.data;
            });
            return promise;
        },
        contact: function (data) {
            var promise = $http.post('/api/admin/frontend/page/' + data.page_id + '/contact', data).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getPlan: function (bedroom_id, from, to, for_action, policy_id) {
            for_action = for_action == null || for_action == '' || for_action == 0 ? 0 : 1;
            if (policy_id && policy_id > 0) {
                var url = '/api/admin/frontend/page/booking/plan/' + bedroom_id + '/' + from + '/' + to + '/' + for_action + '?policy=' + policy_id;
            } else {
                var url = '/api/admin/frontend/page/booking/plan/' + bedroom_id + '/' + from + '/' + to + '/' + for_action;
            }
            var promise = $http.get(url).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getPlans: function (bedroom_ids, from, to, guests, for_action) {
            for_action = for_action == null ? 0 : for_action;
            bedroom_ids = bedroom_ids > 0 ? bedroom_ids : bedroom_ids.join('_');
            var promise = $http.get('/api/admin/frontend/page/booking/plans/' + bedroom_ids + '/' + from + '/' + to + '/' + guests + '/' + for_action).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getBedroom: function (bedroom_ids, from, to, guests) {
            var promise = $http.get('/api/admin/frontend/page/booking/plans/' + bedroom_ids.join('_') + '/' + from + '/' + to + '/' + guests).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getBedroomsModal: function (locale, property) {
            var promise = $http.get('/' + locale + '/page/modal/bedrooms?property_id=' + property).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getArticleModal: function (locale, article_id) {
            var promise = $http.get('/' + locale + '/page/modal/article/' + article_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getArticleImagesModal: function (locale, article_id) {
            var promise = $http.get('/' + locale + '/page/modal/article/' + article_id + '/images').then(function (response) {
                return response.data;
            });
            return promise;
        },
        getArticleMobileModal: function (locale, article_id) {
            var promise = $http.get('/' + locale + '/page/modal/article/' + article_id + '/mobile').then(function (response) {
                return response.data;
            });
            return promise;
        },
        getPoolModal: function (locale, pool_id) {
            var promise = $http.get('/' + locale + '/page/modal/pool/' + pool_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getSpaceModal: function (locale, pool_id) {
            var promise = $http.get('/' + locale + '/page/modal/space/' + pool_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getFeatureGroupModal: function (locale, feature_id, property_id) {
            var promise = $http.get('/' + locale + '/page/modal/feature/group/' + feature_id + '/' + property_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getServiceModal: function (locale, service_id) {
            var promise = $http.get('/' + locale + '/page/modal/service/' + service_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getNewModal: function (locale, new_id) {
            var promise = $http.get('/' + locale + '/page/modal/new/' + new_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getExperiensesPlans: function (bedroom_ids, from, to, guests, kids, infants) {
            var promise = $http.get('/api/admin/experiences/booking/plans/' + bedroom_ids + '/' + from + '/' + to + '/' + guests + '/' + kids + '/' + infants).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getNextAvailableDay: function (data) {
            var promise = $http.post('/api/admin/frontend/pages/manager/properties/minimum/available_date', data).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getTransferDroppOff: function (locale, point_id) {
            var promise = $http.get('/api/admin/frontend/page/' + point_id + '/transfer_drop_off/' + locale).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getNews: function (locale, page_id, limit) {
            var promise = $http.get('/' + locale + '/page/new/load/' + page_id + '/' + limit).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getServices: function (locale, data) {
            var promise = $http.post('/' + locale + '/page/services/load', data).then(function (response) {
                return response.data;
            });
            return promise;
        },
        getDirectionsModal: function (locale, property_id) {
            var promise = $http.get('/' + locale + '/page/modal/directions/' + property_id).then(function (response) {
                return response.data;
            });
            return promise;
        },
        //fetchFacilities: function(data){
        //    let action = '/api/lodge/properties/features-by-group/all?property_id='+data.property_id+'&locale='+data.locale+'&parent=2&active_only=1&is_featured=1';
        //    let post_data = JSON.stringify({'action': action});
        //    return $http.post('/api/admin/lodge/external-api', post_data).then(function (response) {return response.data;});
        //},
        fetchFacilities: function (data) {
            return Promise.resolve({
                "featured_features": [],
                "groups": [
                    {
                        "title": "Amenities",
                        "title_short": "Amenities",
                        "description": "\u003Cp\u003EComplete the basic facilities provided by the property as a summary. In detail, the facilities by category, space or room are optionally broken down into individual sections.\u003C\/p\u003E\u003Cp class = \u0022small hint-text\u0022\u003E NOTE: Individual analysis of the facilities per bedroom or other space you can note in the tabs of their details. \u003C\/p\u003E",
                        "group_id": 2,
                        "fa_icon": "fa-regular fa-square-check",
                        "group_allow_description": false,
                        "group_description": "",
                        "group": [
                            {
                                "group_id": 10,
                                "group_title": "Essentials",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_basics",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 5,
                                        "feature_title": "Essentials",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": "Towels, linen...",
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_10_essentials",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-check-square",
                                        "feature_font_icon_new": "fa-solid fa-check-square",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 6,
                                        "feature_title": "Supplies",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": "Paper, cleaning...",
                                        "feature_allow_description": null,
                                        "feature_slug": "slug_property_feature_10_supplies",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-shopping-basket",
                                        "feature_font_icon_new": "fa-solid fa-shopping-basket",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 13,
                                "group_title": "Kitchen and dining",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_kitchen",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 566,
                                        "feature_title": "Kitchen",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_kitchen_kitchen",
                                        "variable": [
                                            {
                                                "feature_id": 639,
                                                "feature_title": "Amount",
                                                "feature_type": 2,
                                                "feature_description": null,
                                                "feature_value": null
                                            }
                                        ],
                                        "feature_font_icon": "fas fa-knife-kitchen",
                                        "feature_font_icon_new": "fa-solid fa-knife-kitchen",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 20,
                                        "feature_title": "Toaster",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": "For sandwich",
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_toaster",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-sandwich",
                                        "feature_font_icon_new": "fa-solid fa-sandwich",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 787,
                                        "feature_title": "Blender",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_kitchen_blender",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-blender",
                                        "feature_font_icon_new": "fa-solid fa-blender",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 17,
                                        "feature_title": "Dishwasher",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_dishwasher",
                                        "variable": null,
                                        "feature_font_icon": "fal fa-washer",
                                        "feature_font_icon_new": "fa-light fa-washer",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 14,
                                        "feature_title": "Dishes \u0026 Utensils",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": "Dishes, pans, Cutlery",
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_basics",
                                        "variable": null,
                                        "feature_font_icon": "far fa-hat-chef",
                                        "feature_font_icon_new": "fa-regular fa-hat-chef",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1365,
                                        "feature_title": "Silverware\/utensils",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_kitchen_silverware-utensils",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 19,
                                        "feature_title": "Microwave",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_microwave",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-microwave",
                                        "feature_font_icon_new": "fa-solid fa-microwave",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 16,
                                        "feature_title": "Coffee maker",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_coffeemaker",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-coffee-pot",
                                        "feature_font_icon_new": "fa-solid fa-coffee-pot",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 507,
                                        "feature_title": "Barbecue \/ grill",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_15_grill-area",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-shish-kebab",
                                        "feature_font_icon_new": "fa-solid fa-shish-kebab",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 810,
                                        "feature_title": "Dining Table",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_kitchen_dining-table",
                                        "variable": null,
                                        "feature_font_icon": "far fa-table",
                                        "feature_font_icon_new": "fa-regular fa-table",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 499,
                                        "feature_title": "Oven",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_oven",
                                        "variable": null,
                                        "feature_font_icon": "far fa-oven",
                                        "feature_font_icon_new": "fa-regular fa-oven",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 500,
                                        "feature_title": "Hob\/Stove",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_hobs",
                                        "variable": null,
                                        "feature_font_icon": "fad fa-circle",
                                        "feature_font_icon_new": "fa-duotone fa-circle",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 472,
                                        "feature_title": "Kettle",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_13_tkettle",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-cauldron",
                                        "feature_font_icon_new": "fa-solid fa-cauldron",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 501,
                                        "feature_title": "Fridge",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_refrigerator",
                                        "variable": [
                                            {
                                                "feature_id": 420,
                                                "feature_title": "Type",
                                                "feature_type": 7,
                                                "feature_description": null,
                                                "feature_value": null,
                                                "feature_options": []
                                            }
                                        ],
                                        "feature_font_icon": "fas fa-refrigerator",
                                        "feature_font_icon_new": "fa-solid fa-refrigerator",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 518,
                                        "feature_title": "High Chair",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_13_high-chair",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-chair",
                                        "feature_font_icon_new": "fa-solid fa-chair",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1402,
                                        "feature_title": "Wine glasses",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_kitchen_wine-glasses",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 11,
                                "group_title": "Essential amenities",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_comfort",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 7,
                                        "feature_title": "Air Conditioning",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_11_ac",
                                        "variable": [
                                            {
                                                "feature_id": 351,
                                                "feature_title": "Type",
                                                "feature_type": 7,
                                                "feature_description": null,
                                                "feature_value": null,
                                                "feature_options": []
                                            }
                                        ],
                                        "feature_font_icon": "fas fa-air-conditioner",
                                        "feature_font_icon_new": "fa-solid fa-air-conditioner",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 8,
                                        "feature_title": "Heating",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_11_heating",
                                        "variable": [
                                            {
                                                "feature_id": 353,
                                                "feature_title": "Type",
                                                "feature_type": 7,
                                                "feature_description": null,
                                                "feature_value": null,
                                                "feature_options": []
                                            }
                                        ],
                                        "feature_font_icon": "fas fa-heat",
                                        "feature_font_icon_new": "fa-solid fa-heat",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 891,
                                        "feature_title": "Free Wireless Internet",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_basics_wireless-internet",
                                        "variable": [
                                            {
                                                "feature_id": 893,
                                                "feature_title": "Wireless Internet Speed",
                                                "feature_type": 7,
                                                "feature_description": null,
                                                "feature_value": null,
                                                "feature_options": []
                                            }
                                        ],
                                        "feature_font_icon": "fa-solid fa-wifi",
                                        "feature_font_icon_new": "fa-solid fa-wifi",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 768,
                                        "feature_title": "Linen provided",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": "Towels, bed sheets, soap, toilet paper, and pillows",
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_comfort_leuka-idi",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-bed",
                                        "feature_font_icon_new": "fa-solid fa-bed",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 21,
                                        "feature_title": "Washing machine",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_14_washingmachine",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-washer",
                                        "feature_font_icon_new": "fa-solid fa-washer",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 626,
                                        "feature_title": "Iron \u0026 board",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_bathroom_iron-board",
                                        "variable": [
                                            {
                                                "feature_id": 1219,
                                                "feature_title": "On request",
                                                "feature_type": 5,
                                                "feature_description": null,
                                                "feature_value": null
                                            }
                                        ],
                                        "feature_font_icon": "fas fa-union",
                                        "feature_font_icon_new": "fa-solid fa-union",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 100,
                                "group_title": "General",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_general",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 10,
                                        "feature_title": "Internet",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": "Free Wi-Fi \/ ethernet",
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_12_wifi",
                                        "variable": [
                                            {
                                                "feature_id": 1207,
                                                "feature_title": "High-speed Internet Access",
                                                "feature_type": 5,
                                                "feature_description": null,
                                                "feature_value": null
                                            }
                                        ],
                                        "feature_font_icon": "fad fa-router",
                                        "feature_font_icon_new": "fa-duotone fa-router",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 692,
                                        "feature_title": "Parking",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": "Free Parking on Premises",
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_parking_parking",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-parking",
                                        "feature_font_icon_new": "fa-solid fa-parking",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 993,
                                        "feature_title": "Wardrobe or closet",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_06_room_features_wardrobe-or-closet",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 867,
                                        "feature_title": "Travel cot\/crib",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_comfort_baby-cot",
                                        "variable": [
                                            {
                                                "feature_id": 1471,
                                                "feature_title": "Number of cots",
                                                "feature_type": 2,
                                                "feature_description": null,
                                                "feature_value": null
                                            }
                                        ],
                                        "feature_font_icon": "fa-regular fa-container-storage",
                                        "feature_font_icon_new": "fa-regular fa-container-storage",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1385,
                                        "feature_title": "Entire property on ground floor",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_general_entire-property-on-ground-floor",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1190,
                                        "feature_title": "Modern Furnishing",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_general_modern-furnishing",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1410,
                                        "feature_title": "Clothes drying rack",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_general_clothes-drying-rack",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 106,
                                "group_title": "Office",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_office",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 87,
                                "group_title": "Pool and spa facilities",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_pool-and-spa",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 32,
                                        "feature_title": "Pool",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_15_pool",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-swimming-pool",
                                        "feature_font_icon_new": "fa-solid fa-swimming-pool",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 15,
                                "group_title": "Outdoor features",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_outdoor",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 798,
                                        "feature_title": "Outdoor\/Garden furniture",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_outdoor_outdoor-furniture",
                                        "variable": null,
                                        "feature_font_icon": "far fa-couch",
                                        "feature_font_icon_new": "fa-regular fa-couch",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1194,
                                        "feature_title": "Private Balcony or Terrace",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_outdoor_private-balcony-or-terrace",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 797,
                                        "feature_title": "Beach towels",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_outdoor_beach-towels",
                                        "variable": null,
                                        "feature_font_icon": "fad fa-umbrella-beach",
                                        "feature_font_icon_new": "fa-duotone fa-umbrella-beach",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 238,
                                        "feature_title": "Garden",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_15_garden",
                                        "variable": null,
                                        "feature_font_icon": "fal fa-flower-daffodil",
                                        "feature_font_icon_new": "fa-light fa-flower-daffodil",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 33,
                                        "feature_title": "Sunbeds",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_15_sunbeds",
                                        "variable": null,
                                        "feature_font_icon": "far fa-sunglasses",
                                        "feature_font_icon_new": "fa-regular fa-sunglasses",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 28,
                                        "feature_title": "Dining area",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_15_dining",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 886,
                                        "feature_title": "Umbrellas",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_outdoor_umbrellas",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 94,
                                "group_title": "Accommodations",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_accommodations",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 97,
                                "group_title": "Car",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_car",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 101,
                                "group_title": "Locations",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_topothesies",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 736,
                                        "feature_title": "Waterfront",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": true,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_topothesies_prokimaia",
                                        "variable": null,
                                        "feature_font_icon": "fal fa-house-flood",
                                        "feature_font_icon_new": "fa-light fa-house-flood",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 104,
                                "group_title": "Themes",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_themata",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 71,
                                "group_title": "Property Services",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_03_property_services",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 80,
                                "group_title": "Bedding and linen",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_11_bedding",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 76,
                                "group_title": "Bathroom",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_07_bathroom",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 22,
                                        "feature_title": "Hair dryer",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_14_hairdryer",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-wind",
                                        "feature_font_icon_new": "fa-solid fa-wind",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 916,
                                        "feature_title": "Shampoo",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_general_shampoo",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 1404,
                                        "feature_title": "Body soap",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_07_bathroom_body-soap",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 81,
                                "group_title": "Telephone",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_12_telephone",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 111,
                                "group_title": "Sustainability | Eco-friendly features",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_eco-friendly",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 86,
                                "group_title": "Parties \u0026 Events",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_parties-events",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 59,
                                "group_title": "Pets",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_pets",
                                "group_allow_description": true,
                                "features": []
                            },
                            {
                                "group_id": 60,
                                "group_title": "Smoking",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_smoking",
                                "group_allow_description": true,
                                "features": []
                            }
                        ]
                    },
                    {
                        "title": "Entertainment \/ Activities",
                        "title_short": "Entertainment",
                        "description": "",
                        "group_id": 3,
                        "fa_icon": "fa-bicycle",
                        "group_allow_description": true,
                        "group_description": "",
                        "group": [
                            {
                                "group_id": 12,
                                "group_title": "Entertainment",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_entertainment",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 11,
                                        "feature_title": "Television",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_12_tv",
                                        "variable": [
                                            {
                                                "feature_id": 1206,
                                                "feature_title": "Flat Screen TV",
                                                "feature_type": 5,
                                                "feature_description": null,
                                                "feature_value": null
                                            }
                                        ],
                                        "feature_font_icon": "fas fa-tv",
                                        "feature_font_icon_new": "fa-solid fa-tv",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 794,
                                        "feature_title": "Games for kids",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_entertainment_games-for-kids",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-dice-six",
                                        "feature_font_icon_new": "fa-solid fa-dice-six",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 12,
                                        "feature_title": "Satellite\/Cable TV",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_12_satellite",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-satellite",
                                        "feature_font_icon_new": "fa-solid fa-satellite",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 919,
                                        "feature_title": "Books for kids",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_entertainment_books-for-kids",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 823,
                                        "feature_title": "Children\u0027s toys",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_entertainment_kids-toys",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-dice-six",
                                        "feature_font_icon_new": "fa-solid fa-dice-six",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 888,
                                        "feature_title": "Board games\/puzzles",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_amenities_entertainment_board-games",
                                        "variable": null,
                                        "feature_font_icon": "fas fa-dice",
                                        "feature_font_icon_new": "fa-solid fa-dice",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 77,
                                "group_title": "Television",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_08_television",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 89,
                                "group_title": "Sports and Adventure",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_sports-and-adventures",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 802,
                                        "feature_title": "Snorkeling",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": true,
                                        "booking_com_code": null,
                                        "feature_extra_description": "Snorkeling Gear",
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_sports-and-adventures_snorkeling",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 92,
                                "group_title": "Leisure",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_leasure-activities",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 91,
                                "group_title": "Attractions",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_attractions",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 93,
                                "group_title": "Local Features",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_local-features",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 17,
                                "group_title": "Relaxation",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_activities_relax",
                                "group_allow_description": false,
                                "features": []
                            }
                        ]
                    },
                    {
                        "title": "Safety \/ Security",
                        "title_short": "Safety",
                        "description": "",
                        "group_id": 6,
                        "fa_icon": "fa-ambulance",
                        "group_allow_description": true,
                        "group_description": "",
                        "group": [
                            {
                                "group_id": 114,
                                "group_title": "Safety Essentials",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_safety_safety-essentials",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 23,
                                "group_title": "Building safety",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_safety_building",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 778,
                                        "feature_title": "Fire extinguisher",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_safety-feature-values_pirosvestiras",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 24,
                                "group_title": "Tenants safety",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_safety_people",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 779,
                                        "feature_title": "First aid kit",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "1",
                                        "feature_slug": "slug_property_feature_group_amenities_safety-feature-values_kouti-proton-voithion",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 97,
                                        "feature_title": "Safe deposit box",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_24_safebox",
                                        "variable": null,
                                        "feature_font_icon": "fa-regular fa-vault",
                                        "feature_font_icon_new": "fa-regular fa-vault",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    },
                                    {
                                        "feature_id": 699,
                                        "feature_title": "Mosquito nets",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_safety_people_mosquito-nets",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 25,
                                "group_title": "Privacy",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_safety_privacy",
                                "group_allow_description": false,
                                "features": [
                                    {
                                        "feature_id": 1373,
                                        "feature_title": "Private Entrance",
                                        "feature_type": 5,
                                        "feature_value": "1",
                                        "feature_homeaway_code": null,
                                        "feature_homeaway_is_featured": null,
                                        "booking_com_code": null,
                                        "feature_extra_description": null,
                                        "feature_description": null,
                                        "feature_allow_description": "",
                                        "feature_slug": "slug_property_feature_group_safety_privacy_private-entrance",
                                        "variable": null,
                                        "feature_font_icon": "",
                                        "feature_font_icon_new": "",
                                        "feature_sort": null,
                                        "is_featured": 0
                                    }
                                ]
                            },
                            {
                                "group_id": 26,
                                "group_title": "Car",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_safety_cars",
                                "group_allow_description": false,
                                "features": []
                            },
                            {
                                "group_id": 70,
                                "group_title": "Parking and transportation",
                                "group_title_short": null,
                                "group_description": null,
                                "group_slug": "slug_property_feature_group_amenities_02_parking_transportation",
                                "group_allow_description": false,
                                "features": []
                            }
                        ]
                    }
                ]
            });
        },



    };
}]);

myApp.controller(
    'applicationCtrl',
    ["$scope", "endpoints", "$timeout", "$window", "vcRecaptchaService", function ($scope, endpoints, $timeout, $window, vcRecaptchaService) {
        $scope.page_id = null;
        $scope.pp = function (id) {
            $scope.page_id = id;
        };
        $scope.setBedroom = function (id) {
            $scope.bedroom_id = id.toString();
        };
        $scope.setProperty = function (id) {
            $scope.property_id = id.toString();
        };
        $scope.test = function () {
            $('.ui-datepicker').hide();
            $('#bedroomsSelect').focus();
            $scope.selectedBookingStart.loading = 0;
            $scope.initNewBooking();
        };

        $scope.refetchAvailability = (type) => {
            if ($scope.bedroom_id != 'all ') {
                $scope.property_id = $scope.bedroom_id;
                $scope.initVariables(type);
            }

            $('.ui-datepicker').hide();
            $('#bedroomsSelect').focus();
            $scope.selectedBookingStart.loading = 0;
            $scope.initNewBooking();
        };

        $scope.fireSelect2 = function (element) {
            $timeout(function () {
                $(element).select2();
            });
        };


        //bflex

        $scope.checkCookie = function () {
            console.log('checkCookie');
            // var check_cities =  $scope.getQueryVariable('check_cities');

            // if(check_cities=="true"){
            var city = $scope.getCookie('city');

            console.log(city);

            if (city) {
                $scope.has_selected_city = true;
                $scope.selected_city = city;
            } else {
                $scope.triggerPage('hide');
            }
            // }
        }


        $scope.getQueryVariable = function (variable) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) {
                    return pair[1];
                }
            }
            return (false);
        }



        $scope.selected_city = '0';

        $scope.cookie_time = 86400 * 6 * 30;


        $scope.selectCity = function () {
            setTimeout(function () {
                if ($scope.selected_city > 0) {

                    document.cookie = "city=" + $scope.selected_city + ';max-age=' + $scope.cookie_time + ';';
                    $scope.triggerPage('show');
                } else {

                    document.cookie = "city=" + $scope.selected_city + ';max-age=' + $scope.cookie_time + ';';
                    $scope.triggerPage('show');
                }

                var x = document.cookie;

                console.log(x);

            }, 200);
        }

        $scope.changeCity = function (city_id) {

            $scope.selected_city = city_id;
            document.cookie = "city=" + city_id + ';max-age=' + $scope.cookie_time + ';';
            console.log($scope.selected_city);
        }


        $scope.triggerPage = function (action) {

            if (action == "hide") {
                $('nav').hide();
                $('section:not(.cities)').hide();
            } else if (action == "show") {
                $('nav').show();
                $('section:not(.cities)').show();
            }
        }





        $scope.getCookie = function (cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        //endbflex

        //   ------ FEATURES FETCH ------
        $scope.featuredFeatures = null;
        $scope.features = null;
        $scope.groups = null;
        $scope.fetchingFacilities = 0;
        $scope.fetchFacilities = (property_id, locale) => {
            if ($scope.fetchingFacilities === 1) { return; }
            $scope.fetchingFacilities = 1;
            let data = {
                property_id: property_id,
                locale: locale
            };
            endpoints.fetchFacilities(data).then((response) => {
                if (response != null) {
                    $scope.featuredFeatures = response.featured_features;

                    if (response.groups.length > 0) {
                        $scope.groups = response.groups;
                        if ($scope.groups != null && $scope.groups.length > 0) {
                            $scope.features = $scope.groups[0].group;
                        }

                        $scope.fetchingFacilities = 0;
                        $timeout(() => {
                            let $facilities_grid = $('.facilities-grid');
                            let $data_toggle_tooltip = $("[data-toggle='tooltip']");
                            if ($data_toggle_tooltip.length > 0) {
                                $data_toggle_tooltip.tooltip();
                            }
                            if ($facilities_grid.length > 0) {
                                $facilities_grid.masonry({
                                    itemSelector: '.facilities-grid-item',
                                    columnWidth: '.facilities-grid-sizer',
                                    horizontalOrder: true,
                                });
                            }
                        }, 100);
                    } else {
                        $('#facilities_section').remove();
                    }
                    $scope.fetchingFacilities = 0;
                }
            });
        };

        //   ------ NEWSLETTER FORM ------
        $scope.newsletter_email = null;
        $scope.newsletter_first_name = null;
        $scope.newsletter_last_name = null;
        $scope.newsletter_phone = null;
        $scope.newsletterSubscribe = function (valid) {
            if (valid) {
                var data = {
                    'page_id': $scope.page_id,
                    'email': $scope.newsletter_email,
                    'first_name': $scope.newsletter_first_name,
                    'last_name': $scope.newsletter_last_name,
                    'phone': $scope.newsletter_phone
                };
                endpoints.newsletterSubscribe(data).then(function (response) {
                    if (response.success) {
                        var error_message = '<span style="font-size: 1.4em;" class="fa fa-check"></span><p>' + $('#angular_email').html() + ' ' + $scope.newsletter_email + ' ' + $('#angular_successfully_subscribed').html() + '</p>';
                        $scope.fireNotification(error_message, 'notice', 5000);
                    } else {
                        if (response.error == 'user_already_subscribed') {
                            var error_message = '<span style="font-size: 1.4em;" class="fa fa-times"></span><p>' + $('#angular_email').html() + ' ' + $scope.newsletter_email + ' ' + $('#angular_already_subscribed').html() + '</p>';
                            $scope.fireNotification(error_message, 'warning', 5000);
                        } else {
                            var error_message = '<span style="font-size: 1.4em;" class="fa fa-times"></span><p>' + $('#angular_error').html() + '</p>';
                            $scope.fireNotification(error_message, 'error', 5000);
                        }
                    }
                    $scope.newsletter_email = null;
                    $scope.newsletter_first_name = null;
                    $scope.newsletter_last_name = null;
                    $scope.newsletter_phone = null;
                });
            }
        };
        //   ------ END NEWSLETTER FORM ------

        /**********************************   NEWS FEED   **********************************/

        $scope.news = [];
        $scope.totalNews = 0;
        $scope.shownNews = 0;

        $scope.fetchingNewsContent = 0;
        $scope.loadingNews = 0;
        $scope.loadNews = function (locale, page_id, limit) {
            if ($scope.fetchingNewsContent == 1) {
                return false;
            }
            $scope.loadingNews = 1;
            $scope.fetchingNewsContent = 1;
            endpoints.getNews(locale, page_id, limit).then(function (data) {
                if (data.news && data.news.length > 0) {
                    for (var i = 0; i < data.news.length; i++) {
                        var n = data.news[i];
                        $scope.news.push(n);
                    }
                }
                console.log($scope.news);
            }).then(function () {
                $scope.loadingNews = 0;
                $timeout(function () {
                    $('.day').isotope('destroy');

                    $('.day').isotope({
                        "itemSelector": '[data-social="item"]',
                        "masonry": {
                            "columnWidth": 300,
                            "gutter": 20,
                            "isFitWidth": true
                        }
                    });

                    if ($scope.firstFlag == 0)
                        $("html, body").animate({ scrollTop: $("#news").offset().top });
                    $scope.firstFlag = 0;
                }, 500);
                $scope.fetchingNewsContent = 0;
            });
        };

        $scope.loadMoreNews = function (locale, page_id) {
            $scope.news = [];
            $scope.loadingNews = 1;
            $scope.fetchingNewsContent = 1;
            $scope.shownNews = $scope.shownNews + $scope.shownNews;
            if ($('#xlg-news-collections-slick').length && $('#lg-news-collections-slick').length && $('#md-news-collections-slick').length && $('#sm-news-collections-slick').length && $('#xs-news-collections-slick').length) {
                $('#xlg-news-collections-slick').slick('unslick');
                $('#lg-news-collections-slick').slick('unslick');
                $('#md-news-collections-slick').slick('unslick');
                $('#sm-news-collections-slick').slick('unslick');
                $('#xs-news-collections-slick').slick('unslick');
            }

            if ($scope.fetchingNewsContent == 1) {
                return false;
            }
            endpoints.getNews(locale, page_id, $scope.shownNews).then(function (data) {
                if (data.news && data.news.length > 0) {
                    for (var i = 0; i < data.news.length; i++) {
                        var n = data.news[i];
                        $scope.news.push(n);
                    }
                }
                console.log($scope.news);
            }).then(function () {
                $scope.loadingNews = 0;
                $timeout(function () {
                    $('.day').isotope('destroy');

                    $('.day').isotope({
                        "itemSelector": '[data-social="item"]',
                        "masonry": {
                            "columnWidth": 300,
                            "gutter": 20,
                            "isFitWidth": true
                        }
                    });

                    if ($scope.firstFlag == 0)
                        $("html, body").animate({ scrollTop: $("#news").offset().top });
                    $scope.firstFlag = 0;
                }, 500);
                if ($('#xlg-news-collections-slick').length && $('#lg-news-collections-slick').length && $('#md-news-collections-slick').length && $('#sm-news-collections-slick').length && $('#xs-news-collections-slick').length) {
                    $scope.initNewsCollectionsSlick($scope.shownNews);
                }
                $scope.fetchingNewsContent = 0;
            });
        };

        $scope.initNewsCollectionsSlick = function (shownNews) {

            $timeout(function () {
                if (shownNews <= 3) {
                    $('#xlg-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: shownNews,
                        slidesToScroll: shownNews,
                        arrows: false,
                        dots: false
                    });
                    $('#lg-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: shownNews,
                        slidesToScroll: shownNews,
                        arrows: false,
                        dots: false
                    });
                    $('#md-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: shownNews,
                        slidesToScroll: shownNews,
                        arrows: false,
                        dots: false
                    });
                    $('#sm-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: shownNews,
                        slidesToScroll: shownNews,
                        arrows: false,
                        dots: true
                    });
                    $('#xs-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        arrows: false,
                        dots: true
                    });
                } else {
                    $('#xlg-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: 5,
                        slidesToScroll: 5,
                        arrows: false,
                        dots: true
                    });
                    $('#lg-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: 4,
                        slidesToScroll: 4,
                        arrows: false,
                        dots: true
                    });
                    $('#md-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: 3,
                        slidesToScroll: 3,
                        arrows: false,
                        dots: true
                    });
                    $('#sm-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        arrows: false,
                        dots: true
                    });
                    $('#xs-news-collections-slick').not('.slick-initialized').slick({
                        infinite: true,
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        arrows: false,
                        dots: true
                    });
                }
            }, 150);
        };
        $scope.resizeWindow = function () {
            if ($scope.news != null) {
                $scope.newWidth = 0;
                $(window).resize(function () {
                    var width = $(window).width();
                    console.log(width);
                    const card = $('.card.col1').width() + 22;
                    if (width > 991) {
                        if ($scope.news.length < 3) {
                            $scope.newWidth = $scope.news.length * card;
                        } else {
                            $scope.newWidth = 3 * card;
                        }
                        $('.day').css('width', $scope.newWidth);
                    }
                    if (width < 991) {
                        $('.day').css('width', '640');
                    }
                    if (width < 660) {
                        $('.day').css('width', '320');
                    }
                });
            }
        };

        /**********************************   END NEWS FEED   **********************************/


        /************************************  Services  ************************************/
        $scope.totalServicesIncluded = 0;
        $scope.totalServicesOndemand = 0;
        $scope.totalServicesStore = 0;

        $scope.showServicesIncluded = 0;
        $scope.showServicesOndemand = 0;
        $scope.showServicesStore = 0;

        $scope.loadingServicesIncluded = 0;
        $scope.loadingServicesOndemand = 0;
        $scope.loadingServicesStore = 0;

        $scope.loadingMoreServicesIncluded = 0;
        $scope.loadingMoreServicesOndemand = 0;
        $scope.loadingMoreServicesStore = 0;

        $scope.servicesClicked = function (service_id) {
            if (service_id === 1) {
                $scope.loadingServicesIncluded = 1;
                $timeout(function () {
                    $scope.loadingServicesIncluded = 0;
                }, 600);
                $timeout(function () {
                    window.dispatchEvent(new Event('resize'));
                }, 700)
            } else if (service_id === 2) {
                $scope.loadingServicesOndemand = 1;
                $timeout(function () {
                    $scope.loadingServicesOndemand = 0;
                }, 600);
                $timeout(function () {
                    window.dispatchEvent(new Event('resize'));
                }, 700)
            } else if (service_id === 3) {
                $scope.loadingServicesStore = 1;
                $timeout(function () {
                    $scope.loadingServicesStore = 0;
                }, 600);
                $timeout(function () {
                    window.dispatchEvent(new Event('resize'));
                }, 700)
            }
        };

        $scope.loadServices = function (locale, data) {
            if ($scope.fetchingServicesContent == 1) {
                return false;
            }
            $scope.params = data;
            $scope.services = null;
            $scope.loadingServices = 1;
            $scope.fetchingServicesContent = 1;
            endpoints.getServices(locale, $scope.params).then(function (data) {
                $scope.loadingServices = 0;
                $scope.services = data;
                $scope.fetchingServicesContent = 0;
                if ($scope.services.totalServicesIncluded) {
                    $scope.totalServicesIncluded = $scope.services.totalServicesIncluded;
                }
                if ($scope.services.totalServicesOndemand) {
                    $scope.totalServicesOndemand = $scope.services.totalServicesOndemand;
                }
                if ($scope.services.totalServicesStore) {
                    $scope.totalServicesStore = $scope.services.totalServicesStore;
                }
            }).then(function () {
                $scope.initServicesSwiper();
            });
        };

        $scope.loadMoreServices = function (locale, data) {
            $scope.params = data;
            if ($scope.params.addon_type_id === 1) {
                $scope.showServicesIncluded = $scope.showServicesIncluded + $scope.showServicesIncluded;
                // $scope.services.included = [];
                $scope.loadingMoreServicesIncluded = 1;
                $scope.params.limit = $scope.showServicesIncluded;
            } else if ($scope.params.addon_type_id === 2) {
                $scope.showServicesOndemand = $scope.showServicesOndemand + $scope.showServicesOndemand;
                // $scope.services.ondemand = [];
                $scope.loadingMoreServicesOndemand = 1;
                $scope.params.limit = $scope.showServicesOndemand;
            } else if ($scope.params.addon_type_id === 3) {
                $scope.showServicesStore = $scope.showServicesStore + $scope.showServicesStore;
                // $scope.services.store = [];
                $scope.loadingMoreServicesStore = 1;
                $scope.params.limit = $scope.showServicesStore;
            }
            // $('#xlg-news-collections-slick').slick('unslick');
            // $('#lg-news-collections-slick').slick('unslick');
            // $('#md-news-collections-slick').slick('unslick');
            // $('#sm-news-collections-slick').slick('unslick');
            // $('#xs-news-collections-slick').slick('unslick');

            if ($scope.fetchingServicesContent == 1) {
                return false;
            }
            endpoints.getServices(locale, $scope.params).then(function (data) {
                if ($scope.params.addon_type_id === 1) {
                    $scope.services.included = data.included;
                    $scope.loadingMoreServicesIncluded = 0;
                } else if ($scope.params.addon_type_id === 2) {
                    $scope.services.ondemand = data.ondemand;
                    $scope.loadingMoreServicesOndemand = 0;
                } else if ($scope.params.addon_type_id === 3) {
                    $scope.services.store = data.store;
                    $scope.loadingMoreServicesStore = 0;
                }
            });
        };

        $scope.initServicesSwiper = function () {
            $timeout(function () {
                if ($('.swiper-container-services-included')) {
                    new Swiper('.swiper-container-services-included', {
                        navigation: {
                            nextEl: '.swiper-button-next-s-i',
                            prevEl: '.swiper-button-prev-s-i',
                        },
                        pagination: {
                            el: '.swiper-pagination-services-included',
                            type: 'bullets',
                        },
                        loop: true,
                        breakpoints: {
                            320: {
                                slidesPerView: 1,
                                slidesPerGroup: 1,
                                spaceBetween: 20
                            },
                            768: {
                                slidesPerView: 2,
                                slidesPerGroup: 2,
                                spaceBetween: 30
                            },
                            991: {
                                slidesPerView: 3,
                                slidesPerGroup: 3,
                                spaceBetween: 30
                            },
                            // when window width is >= 1200px
                            1200: {
                                slidesPerView: 4,
                                slidesPerGroup: 4,
                                spaceBetween: 30
                            }
                        },
                        loopFillGroupWithBlank: true
                    });
                }
                if ($('.swiper-container-services-ondemand')) {
                    new Swiper('.swiper-container-services-ondemand', {
                        navigation: {
                            nextEl: '.swiper-button-next-s-o',
                            prevEl: '.swiper-button-prev-s-o',
                        },
                        pagination: {
                            el: '.swiper-pagination-services-ondemand',
                            type: 'bullets',
                        },
                        loop: true,
                        breakpoints: {
                            320: {
                                slidesPerView: 1,
                                slidesPerGroup: 1,
                                spaceBetween: 20
                            },
                            768: {
                                slidesPerView: 2,
                                slidesPerGroup: 2,
                                spaceBetween: 30
                            },
                            991: {
                                slidesPerView: 3,
                                slidesPerGroup: 3,
                                spaceBetween: 30
                            },
                            // when window width is >= 1200px
                            1200: {
                                slidesPerView: 4,
                                slidesPerGroup: 4,
                                spaceBetween: 30
                            }
                        },
                        loopFillGroupWithBlank: true
                    });
                }
                if ($('.swiper-container-services-store')) {
                    new Swiper('.swiper-container-services-store', {
                        navigation: {
                            nextEl: '.swiper-button-next-s-s',
                            prevEl: '.swiper-button-prev-s-s',
                        },
                        pagination: {
                            el: '.swiper-pagination-services-store',
                            type: 'bullets',
                        },
                        loop: true,
                        breakpoints: {
                            320: {
                                slidesPerView: 1,
                                slidesPerGroup: 1,
                                spaceBetween: 20
                            },
                            768: {
                                slidesPerView: 2,
                                slidesPerGroup: 2,
                                spaceBetween: 30
                            },
                            991: {
                                slidesPerView: 3,
                                slidesPerGroup: 3,
                                spaceBetween: 30
                            },
                            // when window width is >= 1200px
                            1200: {
                                slidesPerView: 4,
                                slidesPerGroup: 4,
                                spaceBetween: 30
                            }
                        },
                        loopFillGroupWithBlank: true
                    });
                }
            }, 150);
        };

        /**********************************  END Services  *********************************/


        //   ------ CONTACT FORM ------
        $scope.contact = {
            first_name: null,
            last_name: null,
            email: null,
            phone: null,
            message: null,
            captchaSiteKey: $('#html_element').html(),
            sending: 0,
            property_name: null,
            property_page: null,
            property_email: null
        };

        $scope.sendContact = (function (valid) {

            var c = $('#g-recaptcha-response');
            if (c.length) {
                var r = c.val();
                if (!r.length > 0) {
                    return false;
                }
            }

            if (valid) {
                var data = {
                    'page_id': $scope.page_id,
                    'first_name': $scope.contact.first_name,
                    'last_name': $scope.contact.last_name,
                    'email': $scope.contact.email,
                    'phone': $scope.contact.phone,
                    'message': $scope.contact.message,
                    'property_name': $scope.contact.property_name,
                    'property_page': $scope.contact.property_page,
                    'property_email': $scope.contact.property_email
                };
                $scope.contact.sending = 1;
                endpoints.contact(data).then(function (response) {
                    if (response.success) {
                        window.location.reload();
                        var error_message = '<span style="font-size: 1.4em;" class="fa fa-check"></span><p>' + $('#angular_message_delivered').html() + '</p>';
                        $scope.fireNotification(error_message, 'notice', 5000);
                    } else {
                        var error_message = '<span style="font-size: 1.4em;" class="fa fa-times"></span><p>' + $('#angular_error').html() + '</p>';
                        $scope.fireNotification(error_message, 'error', 5000);
                    }
                    $scope.contact = {
                        first_name: null,
                        last_name: null,
                        email: null,
                        phone: null,
                        message: null,
                        recaptchaResponse: null,
                        property_name: null,
                        property_page: null,
                        property_email: null
                    };
                    $scope.contact.sending = 0;
                });
            }
        });

        //   ------ END CONTACT FORM ------

        // NEW DATEPICKER

        $scope.booking_type = null;
        $scope.property_type = null;
        $scope.check_for_not_available = true;
        $scope.property_id = null;

        $scope.initVariables = function (type) {
            $scope.booking_type = type;
            var params = {};
            params.property_id = $scope.property_id;
            endpoints.getNextAvailableDay(params).then(function (data) {
                if (type != "other") {
                    if (data.from) {
                        $scope.from = data.from;
                        if (data.to) {
                            $scope.to = data.to;
                        }
                        if (data.no_available_for_arrival) {
                            $scope.not_check_out_dates = data.no_available_for_arrival;
                            $scope.check_for_not_available = false;
                        }
                    } else {
                        $scope.from = moment().format('DD-MM-YYYY');
                    }
                } else {
                    $scope.from = moment().format('DD-MM-YYYY');
                    var a = moment();
                    a.add(7, "day");
                    $scope.to = a.format('DD-MM-YYYY');;
                }

                $scope.guests = 2;
                if (type == "web") {
                    if ($scope.property_type == 1) {
                        $scope.initDefaults();
                        $scope.fetchData();
                    } else {
                        $scope.initDefaults();
                        $scope.fetchMinimumPrice();
                        $scope.initWebHotelier();
                        $scope.fetchRangeMinimumPrice();
                    }
                } else if (type == "other") {
                    $scope.initDefaultsCalendars();
                } else {

                    if ($scope.property_type == 1) {
                        $scope.initDefaults();
                        $scope.fetchData();
                    } else {

                    }
                }
            });
        }

        $scope.otherChannelFormBook = (url, form_id) => {
            let book_url = url;
            let $formData = new FormData(document.querySelector(form_id));
            for (var pair of $formData.entries()) {
                book_url += `&${pair[0]}=${pair[1]}`;
            }
            window.open(book_url, '_blank');
        };

        $scope.fireBookingSolution = function () {
            $('#calendarBookingFrom').datepicker({
                format: 'dd-mm-yyyy',
                startDate: '-0d',
                autoclose: true
            });
            $('#calendarBookingTo').datepicker({
                format: 'dd-mm-yyyy',
                startDate: '-0d',
                autoclose: true
            });
        };

        // webhotelier
        $scope.initDefaultsCalendars = function () {

            $scope.selectedDateFrom = $scope.from;
            $scope.selectedDateTo = $scope.to;
            $scope.selectedBookingStart.raw_date = moment();

            var b = $('#calendarBookingFrom').datepicker({
                format: 'dd-mm-yyyy',
                startDate: '-0d',
                autoclose: true
            }).on('changeDate', function (e) {

                if ($scope.selectedDatepickerBookingTo != null) {
                    $('#calendarBookingTo').datepicker('remove');
                }

                var string = e.format(0, "mm-dd-yyyy");
                var v = moment(string, 'MM-DD-YYYY');
                $scope.selectedBookingStart.raw_date = v;
                $scope.selectedBookingStart.date = v.format('DD-MM-YYYY');
                $('#calendarBookingTo').val('');
                $scope.selectedDateFrom = v.format('DD-MM-YYYY');
                if ($scope.selectedBookingEnd != null && $scope.selectedBookingEnd.raw_date && $scope.selectedBookingEnd.raw_date != null) {
                    $scope.selectedDateTo = $scope.selectedBookingEnd.raw_date.format('DD-MM-YYYY');
                }
                var minDate = angular.copy($scope.selectedBookingStart.raw_date);
                minDate.add(1, "day");
                $scope.selectedDatepickerBookingTo = $('#calendarBookingTo').datepicker({
                    format: 'dd-mm-yyyy',
                    autoclose: true,
                    startDate: minDate.format('DD-MM-YYYY'),
                });
                if ($('#calendarBookingTo').val() == "") {
                    $('#calendarBookingTo').datepicker('show');
                }

            });


            var minDate = angular.copy($scope.selectedBookingStart.raw_date);
            minDate.add(1, "day");
            $scope.selectedDatepickerBookingTo = $('#calendarBookingTo').datepicker({
                format: 'dd-mm-yyyy',
                startDate: minDate.format('DD-MM-YYYY'),
                autoclose: true
            });


        };

        $scope.initDefaults = function () {
            $scope.selectedDateFrom = $scope.from;
            $scope.selectedDateTo = $scope.to;
        };


        //----- BOOKING --------------------- ////
        $scope.range = function (min, max, step, limit) {
            min = parseInt(min);
            max = parseInt(max);
            step = parseInt(step) || 1;
            limit = parseInt(limit) || 1000;
            var input = [];
            for (var i = min; i <= max; i += step) {
                if (i > limit) { continue; }
                input.push(i);
            }
            return input;
        };


        $scope.fireNotification = function (message, type, ttl) {
            var notification = new NotificationFx({
                message: message,
                layout: 'bar',
                effect: 'slidetop',
                type: type,
                ttl: ttl
            });
            notification.show();
        };

        var tomorrow = moment(new Date()).add(1, 'days');
        var nextEightDays = moment(new Date()).add(8, 'days');


        $scope.booking_domain = null;
        $scope.bedroom_id = null;
        $scope.plans = [];
        $scope.bedrooms = [];
        $scope.bedroom_ids = [];
        $scope.availability = {};
        $scope.activeBedroom = {};
        $scope.search = {
            bedroom_id: null,
            from: tomorrow.format('DD-MM-YYYY'),
            to: nextEightDays.format('DD-MM-YYYY'),
            adults: 2,
            rooms: 1,
            kids: 0,
            guests: 0,
            hotel: null
        };

        $scope.getBedroom = function (bedroom_id) {

        };

        $scope.properties_bedrooms = {};
        $scope.addBedroom = function (id, name, capacityIdeal, capacityMax, capacityKids, property_id, kidsProhibited) {

            var bedroom = {
                id: id,
                title: name,
                capacityIdeal: capacityIdeal,
                capacityMax: capacityMax,
                kidsProhibited: kidsProhibited,
                capacityKids: capacityKids >= 0 ? capacityKids : 10
            };

            $scope.properties_bedrooms[id] = property_id;

            $scope.bedrooms.push(bedroom);
            $scope.bedroom_ids.push(id);
        };

        $scope.getAvailability = function () {

        };

        $scope.selectedBookingStart = {
            bedroom_id: null,
            property: null,
            date: null,
            raw_date: null,
            loading: 0,
            saving: 0
        };

        $scope.selectedBookingEnd = {
            bedroom_id: null,
            date: null,
            raw_date: null,
            property: null
        };

        $scope.planBookingData = null;

        $scope.selectedDatepickerBookingFrom = tomorrow.format('DD-MM-YYYY');
        $scope.selectedDatepickerBookingTo = nextEightDays.format('DD-MM-YYYY');

        $scope.initNewBooking = function () {
            if ($scope.selectedBookingStart.loading != 0) { return; }
            $scope.activeBedroom = {

            };
            $scope.selectedBookingStart.loading = 1;
            $scope.selectedBookingStart.bedroom_id = $scope.bedroom_id;
            $scope.selectedBookingStart.date = $scope.formatDate(moment(), 'DD-MM-YYYY');
            $scope.selectedBookingStart.raw_date = moment();

            $scope.selectedBookingEnd = {
                bedroom_id: null,
                date: null,
                raw_date: null,
                property: null
            };

            if ($scope.selectedDatepickerBookingFrom != null) {
                $('#calendarBookingFrom').datepicker('remove');
            }

            if ($scope.selectedDatepickerBookingTo != null) {
                $('#calendarBookingTo').datepicker('remove');
            }
            if ($scope.check_for_not_available) {
                $scope.not_check_out_dates = [];
            }

            $scope.selectedDatepickerFrom =
                $('#calendarBookingFrom').datepicker({
                    format: 'dd-mm-yyyy',
                    startDate: '-0d',
                    autoclose: true,
                    beforeShowDay: function (date) {
                        var mm = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1; //January is 0!
                        var dd = date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate();
                        var momentFormat = date.getFullYear() + '-' + mm + '-' + dd;
                        var mo = moment(momentFormat);
                        var check = $scope.showClass(mo, $scope.selectedBookingStart.bedroom_id);
                        switch (check) {
                            case 59:
                                return { enabled: true }
                                break;
                            case 60:
                                return { enabled: false, classes: "full-reserve" }
                                break;
                            case 61:
                                return { enabled: false, classes: "full-reserve" }
                                break;
                            case 62:
                                return { enabled: false, classes: "full-reserve" }
                                break;
                            case 63:
                                return { enabled: false, classes: "full-reserve" }
                                break;
                            case 'BP':
                                return { enabled: false, classes: "full-reserve" }
                                break;
                            case 'not_available_for_arrival':
                                return { enabled: false, classes: "not_available_for_arrival" }
                                break;
                            default:
                                break;
                        }
                    }

                }).on('changeDate', function (e) {
                    var string = e.format(0, "mm-dd-yyyy");
                    var v = moment(string, 'MM-DD-YYYY');
                    $scope.selectedBookingStart.raw_date = v;
                    $scope.selectedBookingStart.date = v.format('DD-MM-YYYY');
                    var endDate = angular.copy($scope.selectedBookingStart.raw_date);
                    endDate.add(24, "month").endOf('month');
                    var endDateFormatted = endDate.format('YYYY-MM-DD');
                    var startDateFormatted = $scope.selectedBookingStart.raw_date.format('YYYY-MM-DD');

                    $('#calendarBookingTo').val('');
                    $scope.selectedDateFrom = v.format('DD-MM-YYYY');
                    if ($scope.selectedBookingEnd != null && $scope.selectedBookingEnd.raw_date && $scope.selectedBookingEnd.raw_date != null) {
                        $scope.selectedDateTo = $scope.selectedBookingEnd.raw_date.format('DD-MM-YYYY');
                    }

                    $scope.selectedBookingStart.min_stay = $scope.data[$scope.selectedBookingStart.bedroom_id.toString()][$scope.formatDate(v, 'YYYYMMDD').toString()].min_stay;

                    if ($scope.check_for_not_available) {
                        $scope.not_check_out_dates = [];
                        var cc = $scope.selectedBookingStart.bedroom_id.toString();
                        var i = true;
                        var counter = 0;
                        do {
                            var a = angular.copy($scope.selectedBookingStart.raw_date);
                            var b = a.add(counter, "day");
                            if (counter < ($scope.selectedBookingStart.min_stay)) {
                                var s = $scope.data[cc][$scope.formatDate(b, 'YYYYMMDD').toString()].status;
                                if (s = 59) {
                                    $scope.not_check_out_dates.push($scope.formatDate(b, 'YYYYMMDD').toString());
                                } else if (s != 59 && afco == true) {
                                    $scope.not_check_out_dates.push($scope.formatDate(b, 'YYYYMMDD').toString());
                                } else {
                                    i = false;
                                }
                            } else {
                                i = false;
                            }
                            counter++;
                            if (counter == 30) {
                                break;
                            }
                        }
                        while (i = true);

                    } else {
                        $scope.check_for_not_available = true;
                    }

                    if ($scope.bedroom_id == 'all') {
                        $scope.fetchData();
                    } else {
                        $scope.fetchCalendar(startDateFormatted, endDateFormatted);
                    }

                });

            var endDate = angular.copy($scope.selectedBookingStart.raw_date);
            endDate.add(24, "month").endOf('month');
            var endDateFormatted = endDate.format('YYYY-MM-DD');
            var startDateFormatted = $scope.selectedBookingStart.raw_date.format('YYYY-MM-DD');
            $timeout(function () {
                $('#bookingForm').validate();
            }, 200);
            if ($scope.bedroom_id == 'all') {
                $scope.fetchData();
            } else {
                $scope.fetchCalendar(startDateFormatted, endDateFormatted);
            }
        };


        $scope.fetchCalendar = function (startDateFormatted, endDateFormatted) {
            var minDate = angular.copy($scope.selectedBookingStart.raw_date);
            minDate.add(1, "day");

            endpoints.getPlans($scope.selectedBookingStart.bedroom_id, startDateFormatted, endDateFormatted, $scope.guests, 1).then(function (data) {

                data = data[$scope.selectedBookingStart.bedroom_id];
                $scope.planBookingData = data;
                if ($scope.selectedDatepickerBookingTo != null) {
                    $('#calendarBookingTo').datepicker('remove');
                }
                $scope.selectedBookingStart.loading = 0;
                $timeout(function () {
                    $scope.selectedDatepickerBookingTo =
                        $('#calendarBookingTo').datepicker({
                            format: 'dd-mm-yyyy',
                            startDate: minDate.format('DD-MM-YYYY'),
                            autoclose: true,
                            beforeShowDay: function (date) {
                                var dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
                                var mm = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1; //January is 0!

                                var yyyy = date.getFullYear();
                                var formatted = yyyy + '-' + mm + '-' + dd;
                                var formatted_for_check_out = yyyy + '' + mm + '' + dd;

                                if (typeof (data[formatted]) !== 'undefined') {
                                    var check = data[formatted].status;
                                } else {
                                    var check = 60;
                                }
                                switch (check) {
                                    case 59:
                                        if ($scope.not_check_out_dates.length > 0) {
                                            if ($scope.not_check_out_dates.indexOf(formatted_for_check_out) != -1) {
                                                return { enabled: false, classes: "not_available_for_arrival" }
                                            } else {
                                                return { enabled: true }
                                            }
                                        } else {
                                            return { enabled: true }
                                        }
                                        break;
                                    case 60:
                                        if (data[formatted] && data[formatted].available_for_check_out) {
                                            return { enabled: true }
                                        } else {
                                            return { enabled: false, classes: "full-reserve" }
                                        }
                                        break;
                                    case 61:
                                        if (data[formatted] && data[formatted].available_for_check_out) {
                                            return { enabled: true }
                                        } else {
                                            return { enabled: false, classes: "full-reserve" }
                                        }
                                        break;
                                    case 62:
                                        if (data[formatted] && data[formatted].available_for_check_out) {
                                            return { enabled: true }
                                        } else {
                                            return { enabled: false, classes: "full-reserve" }
                                        }
                                        break;
                                    case 63:
                                        if (data[formatted] && data[formatted].available_for_check_out) {
                                            return { enabled: true }
                                        } else {
                                            return { enabled: false, classes: "full-reserve" }
                                        }
                                        break;
                                    case 'not_available_for_arrival':
                                        if ($scope.not_check_out_dates.length > 0) {
                                            if ($scope.not_check_out_dates.indexOf(formatted_for_check_out) != -1) {
                                                return { enabled: false, classes: "not_available_for_arrival" }
                                            } else {
                                                return { enabled: true }
                                            }
                                        } else {
                                            return { enabled: true }
                                        }
                                        break;
                                    case 'BP':
                                        return { enabled: true }
                                        break;
                                    default:
                                        return { enabled: false }
                                        break;
                                }
                            }

                        }).on('changeDate', function (e) {
                            var string = e.format(0, "mm-dd-yyyy");
                            var v = moment(string, 'MM-DD-YYYY');
                            $scope.selectedBookingEnd.raw_date = v;
                            $scope.selectedBookingEnd.date = v.format('DD-MM-YYYY');
                            $scope.selectedDateTo = v.format('DD-MM-YYYY');
                            //$scope.watchGuests();

                        });

                    if ($('#calendarBookingTo').val() == "") {
                        $('#calendarBookingTo').datepicker('show');

                    }

                }, 100);
                // todo show calendar

            });
        }

        $scope.excludes = [];
        $scope.data = [];
        $scope.start_range = null;
        $scope.end_range = null;

        $scope.fetchData = function () {

            if ($scope.start_range == null) {
                var startDate = moment();
                var startDateFormatted = startDate.format('YYYY/MM/DD');
                var endDate = angular.copy(startDate);
                endDate.add(24, "month").endOf('month');
                var endDateFormatted = endDate.format('YYYY/MM/DD');
                $scope.start_range = startDateFormatted;
                $scope.end_range = endDateFormatted;
            }

            var itr = moment.twix(new Date($scope.start_range), new Date($scope.end_range)).iterate("days");
            var range = [];
            while (itr.hasNext()) {
                range.push(itr.next())
            }
            $scope.date_range = range;

            $scope.data = [];
            for (var i = 0; i < $scope.date_range.length; i++) {
                var item = $scope.date_range[i];
                for (var b = 0; b < $scope.bedroom_ids.length; b++) {
                    var bed = $scope.bedroom_ids[b];
                    if (typeof ($scope.data[bed]) === 'undefined') {
                        $scope.data[bed.toString()] = {};
                    }
                    var obj = {};
                    obj.loading = 1;
                    obj.status = null;
                    obj.price = null;
                    $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()] = obj;
                }
            }

            var bedroom_ids = $scope.bedroom_ids;
            var guests = 1;

            endpoints.getPlans(bedroom_ids, $scope.start_range.split('/').join('-'), $scope.end_range.split('/').join('-'), guests, 0).then(function (plans) {
                $scope.excludes = [];
                for (var i = 0; i < $scope.date_range.length; i++) {
                    var item = $scope.date_range[i];
                    for (var b = 0; b < $scope.bedroom_ids.length; b++) {
                        var bed = $scope.bedroom_ids[b];

                        if ($.inArray(bed.toString() + '__' + $scope.formatDate(item, 'YYYY-MM-DD').toString(), $scope.excludes) != -1) {
                            delete $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()];
                            continue;
                        }

                        if (typeof (plans[bed]) !== 'undefined') {
                            var objec = plans[bed.toString()][$scope.formatDate(item, 'YYYY-MM-DD').toString()];
                            if (objec.order_id) {
                                var colspan = 0;
                                var order_id = objec.order_id;
                                var end_date = null;
                                for (var t = i; i < $scope.date_range.length; t++) {
                                    var item_t = $scope.date_range[t];
                                    if (typeof (plans[bed]) !== 'undefined') {
                                        var objec_tt = plans[bed.toString()][$scope.formatDate(item_t, 'YYYY-MM-DD').toString()];
                                        if (objec_tt.order_id && objec_tt.order_id == order_id) {
                                            colspan++;
                                            end_date = $scope.formatDate(item_t, 'YYYY-MM-DD').toString();
                                            if (colspan > 1) {
                                                $scope.excludes.push(bed.toString() + '__' + $scope.formatDate(item_t, 'YYYY-MM-DD').toString());
                                            }
                                        } else {
                                            break;
                                        }
                                    }
                                }
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].colspan = colspan;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].end_date = end_date;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].order_id = order_id;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].booking_id = objec.booking_id;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].booking_name = objec.booking_name;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].booking_status = objec.booking_status;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].loading = 0;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].status = objec.status;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].price = objec.price;
                                if (objec.has_booking_checkout) {
                                    $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].has_booking_checkout = objec.has_booking_checkout;
                                }

                                if ($.inArray(bed.toString() + '__' + $scope.formatDate(item, 'YYYY-MM-DD').toString(), $scope.excludes) != -1) {
                                    delete $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()];
                                }

                            } else {
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].loading = 0;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].status = objec.status;
                                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].price = objec.price;
                                if (objec.has_booking_checkout) {
                                    $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].has_booking_checkout = objec.has_booking_checkout;
                                }
                                if (objec.booking_status) {
                                    $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].booking_status = objec.booking_status;
                                }
                            }
                        }

                    }
                }
                $timeout(function () {
                    $scope.initNewBooking();
                }, 500);
            });
        };

        $scope.error_kids = false;
        $scope.error_adults = false;

        $scope.findAvailability = function (valid) {
            console.log(valid);
            $scope.error_kids = false;
            $scope.error_adults = false;

            $scope.search.from = $('#calendarBookingFrom').val();
            $scope.search.to = $('#calendarBookingTo').val();

            if ($scope.search.from == null || $scope.search.from == '' || $scope.search.from == 'undefined') {
                $('#calendarBookingFrom').trigger('click');
                return;
            }
            if ($scope.search.to == null || $scope.search.to == '' || $scope.search.to == 'undefined') { return; }


            if ($scope.search.from != 'undefined-undefined-' && $scope.search.to != 'undefined-undefined-' && $scope.search.from != null && $scope.search.to != null && $scope.search.adults > 0 && $scope.search.from != undefined && $scope.search.to != undefined && $scope.search.from != 'undefined' && $scope.search.to != 'undefined') {
                var other_guests = 0;
                var kids = [];
                if ($scope.search.kids > 0) {
                    $(".kidsSelect").each(function (index) {
                        var age = $(this).val();
                        kids.push(age);
                    });

                }
                $scope.search.guests = parseInt($scope.search.adults) + other_guests;
                if ($scope.search.guests > $scope.activeBedroom.capacityMax) {
                    $scope.error_adults = true;
                    return;
                }
                if (kids.length > $scope.activeBedroom.capacityKids) {
                    $scope.error_kids = true;
                    return;
                }

                var from_split = $scope.search.from.split('-');
                var from = from_split[2] + '-' + from_split[1] + '-' + from_split[0];
                var to_split = $scope.search.to.split('-');
                var to = to_split[2] + '-' + to_split[1] + '-' + to_split[0];

                var exit_url = $scope.booking_domain + '?bedroom=' + $scope.bedroom_id + '&from=' + from + '&to=' + to + '&guests=' + $scope.search.guests;
                if (kids.length > 0) {
                    exit_url = exit_url + '&kids=' + kids.join('-');
                }

                $window.location.href = exit_url;
            }
            return;
        };

        $scope.checkAdults = function () {
            $scope.error_kids = false;
            var other_guests = 0;
            var kids = 0;
            $timeout(function () {
                if ($scope.search.kids > 0) {
                    $(".kidsSelect").each(function (index) {
                        var age = $(this).val();
                        if (age > 3) {
                            other_guests++;
                        } else {
                            kids++;
                        }
                    });
                }
                $scope.search.guests = parseInt($scope.search.adults) + other_guests;
                if ($scope.search.guests > $scope.activeBedroom.capacityMax) {
                    $scope.error_adults = true;
                    return;
                }
            }, 300);

        };

        $scope.checkKids = function () {
            $scope.error_kids = false;
            var other_guests = 0;
            var kids = [];
            $timeout(function () {
                if ($scope.search.kids > 0) {
                    $(".kidsSelect").each(function (index) {
                        var age = $(this).val();
                        kids.push(age);
                    });
                }
                $scope.search.guests = parseInt($scope.search.adults) + other_guests;
                if (kids.length > $scope.activeBedroom.capacityKids) {
                    $scope.error_kids = true;
                    return;
                }
                $scope.chunkKids();
            }, 300);

        };

        $scope.formatDate = function (date, format) {
            if (format == null) {
                format = 'YYYY/MM/DD';
            }
            return date.format(format);
        };
        $scope.showClass = function (date, bed) {
            if (typeof ($scope.data[bed.toString()]) !== 'undefined' && typeof ($scope.data[bed][$scope.formatDate(date, 'YYYYMMDD').toString()]) !== 'undefined') {
                return $scope.data[bed][$scope.formatDate(date, 'YYYYMMDD').toString()].status;
            }
        };

        $scope.chunkedData = [];
        $scope.chunkKids = function () {
            var newArr = [];
            var size = 1;
            var arr = [];
            for (var v = 1; v <= $scope.search.kids; v++) {
                arr.push(v);
            }
            $scope.chunkedData = [];
            for (var i = 0; i < arr.length; i += size) {
                newArr.push(arr.slice(i, i + size));
            }
            $scope.chunkedData = newArr;
        };

        $scope.bedroom_id = null;
        $scope.property_type = null;
        $scope.show_single = true;
        $scope.daysData = {};
        $scope.loading_calendar = 0;
        $scope.calendar = null;
        $scope.minDate = 0;
        $scope.monthsNum = 6;
        $scope.property_name = null;
        $scope.property_email = null;
        $scope.baseDate = null;

        $scope.getData = function () {
            $scope.daysData = {};

            if ($scope.baseDate == null) {
                var date = new Date(), y = date.getFullYear(), m = date.getMonth();
                $scope.baseDate = new Date(y, m, 1);
            }

            var toDate = angular.copy($scope.baseDate);
            if ($scope.minDate >= 0) {
                var substract = $scope.minDate + 6;
            } else if ($scope.minDate < 0) {
                var substract = $scope.minDate - 6;
            }
            toDate.setMonth($scope.baseDate.getMonth() + substract);

            var mm_start = ($scope.baseDate.getMonth() + 1) < 10 ? '0' + ($scope.baseDate.getMonth() + 1) : ($scope.baseDate.getMonth() + 1);
            var dd_start = $scope.baseDate.getDate() < 10 ? '0' + $scope.baseDate.getDate() : $scope.baseDate.getDate();
            var formatted_start = $scope.baseDate.getFullYear() + '-' + mm_start + '-' + dd_start;

            var mm_end = (toDate.getMonth() + 1) < 10 ? '0' + (toDate.getMonth() + 1) : (toDate.getMonth() + 1);
            var dd_end = toDate.getDate() < 10 ? '0' + toDate.getDate() : toDate.getDate();
            var formatted_end = toDate.getFullYear() + '-' + mm_end + '-' + dd_end;

            endpoints.getPlan($scope.bedroom_id, formatted_start, formatted_end).then(function (data) {
                $scope.daysData = data;
                $timeout(function () {
                    $scope.initCalendar();
                }, 100);
            });

        };

        $scope.initCalendar = function () {
            $scope.show_single = true;
            var size = Object.keys($scope.daysData).length;
            if (size == 0) {
                $scope.getData();
                return;
            }
            $scope.loading_calendar = 0;

            if ($scope.calendar != null) {
                $('#calendar').datepicker('destroy');
            }
            $timeout(function () {
                $scope.calendar =
                    $('#calendar').datepicker({
                        defaultDate: $scope.minDate + 'm',
                        numberOfMonths: $scope.monthsNum,
                        inline: true,
                        showOtherMonths: false,
                        onSelect: function (dateText, inst) {
                            return;
                            var v = moment(dateText);
                            var formatted = v.format('YYYY-MM-DD');
                            if (typeof ($scope.daysData[formatted]) !== 'undefined') {
                                var check = $scope.daysData[formatted].status;
                            } else {
                                var check = 60;
                            }
                            if (check == 61) {
                                $scope.editBooking($scope.bedroom_id, $scope.daysData[formatted].booking_id);
                                $('#editBooking').modal('show');
                            } else {
                                $scope.selectStartDay($scope.bedroom_id, v, $scope.property_name);
                                $('#modalSlideLeft').modal('show');
                            }
                            $scope.single = true;

                        },
                        beforeShowDay: function (date) {
                            var dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
                            var mm = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1; //January is 0!
                            var yyyy = date.getFullYear();
                            var shortDate = dd + '/' + mm + '/' + yyyy;
                            var formatted = yyyy + '-' + mm + '-' + dd;
                            var today = new Date();
                            if (typeof ($scope.daysData[formatted]) !== 'undefined') {
                                var data = $scope.daysData[formatted];
                                var d = $scope.daysData[formatted];
                                var check = $scope.daysData[formatted].status;
                            } else {
                                var check = 60;
                            }
                            switch (check) {
                                case 59:
                                    if (data.is_last_day != null && data.is_first_day == null) {
                                        return [true, " book-reserve-right ", shortDate + " - Booked "]
                                    } else if (data.is_last_day == null && data.is_first_day != null) {
                                        return [true, " book-reserve-left ", shortDate + " - Booked "]
                                    } else if (data.previous_day_status == 61) {
                                        return [true, " book-reserve-left ", shortDate + " - Booked "]
                                    }

                                    else {
                                        return [true, " full-changeover ", shortDate + " - Available for arrival "];
                                    }
                                    break;
                                case 60:
                                    return [true, "", shortDate + " - Unavailable"];
                                    break;
                                case 61:
                                    if (data.previous_day_status == 62) {
                                        return [true, " na-reserve-right ", shortDate + " - Booked "]
                                    } else if (data.previous_day_status == 59) {
                                        return [true, " book-reserve-left", shortDate + " - Booked "]
                                    }
                                    else if (data.is_last_day != null && data.is_first_day == null) {
                                        return [true, " na-reserve-left ", shortDate + " - Booked "]
                                    } else if (data.is_last_day == null && data.is_first_day != null) {
                                        return [true, " na-reserve-right ", shortDate + " - Booked "]
                                    }

                                    else {
                                        return [true, " full-reserve ", shortDate + " - Booked "]
                                    }
                                    break;
                                case 62:
                                    if (data.is_last_day == 1) {
                                        return [true, " na-reserve-left", shortDate + " - Not operating"]
                                    } else {
                                        return [true, "", shortDate + " - Not operating"]
                                    }

                                    break;
                                case 63:
                                    return [true, " stop-sales ", shortDate + " -Stop Sales"]
                                    break;
                                case 'BP':
                                    return [false, " full-reserve BP", shortDate + " - Unavailable for booking "]
                                    break;
                            }
                        }
                    });
                $scope.loading_calendar = 0;
                $('#calendar').datepicker('update');
            }, 500);

        };

        $scope.forward = function () {
            $scope.loading_calendar = 1;
            $scope.daysData = {};
            $scope.minDate = $scope.minDate + 6;
            $scope.initCalendar();
        };
        $scope.backward = function () {
            $scope.loading_calendar = 1;
            $scope.daysData = {};
            $scope.minDate = $scope.minDate - 6;
            $scope.initCalendar();
        };

        $scope.fireBookingSolution = function () {
            $('#calendarBookingFrom').datepicker({
                timePicker: false,
                minDate: 0,
                dateFormat: 'yy-mm-dd',
                showButtonPanel: true,
                beforeShow: function (input, inst) {
                    var offset = $(input).offset();
                    var height = $(input).height();
                    var w_width = $(window).width();
                }

            });
            $('#calendarBookingTo').datepicker({
                timePicker: false,
                minDate: 0,
                dateFormat: 'yy-mm-dd',
                showButtonPanel: true,
                beforeShow: function (input, inst) {
                    var offset = $(input).offset();
                    var height = $(input).height();
                    var w_width = $(window).width();
                }

            });
        };

        $scope.fireHotel = function () {
            $scope.selectedDatepickerBookingFrom =
                $('#calendarBookingFrom').datepicker({
                    timePicker: false,
                    minDate: 0,
                    dateFormat: 'dd-mm-yy',
                    showButtonPanel: true,
                    onSelect: function (dateText, inst) {
                        // return false;
                        var m = (inst.selectedMonth + 1);
                        if (m < 10) {
                            m = '0' + m;
                        }
                        var string = m + '/' + inst.selectedDay + '/' + inst.selectedYear;
                        var v = moment(string);
                        $scope.selectedBookingStart.raw_date = v;
                        $scope.selectedBookingStart.date = v.format('DD-MM-YYYY');

                        if ($scope.selectedDatepickerBookingTo != null) {
                            $('#calendarBookingTo').datepicker('destroy');
                        }

                        $('#calendarBookingTo').val('');
                        $scope.selectedDatepickerBookingTo = $('#calendarBookingTo').datepicker({
                            timePicker: false,
                            minDate: $scope.selectedBookingStart.date,
                            dateFormat: 'dd-mm-yy',
                            showButtonPanel: true,
                        });
                    },
                });
        };

        $scope.findHotelRooms = function () {
            $scope.error_kids = false;
            $scope.error_adults = false;
            $scope.search.from = $('#calendarBookingFrom').val();
            $scope.search.to = $('#calendarBookingTo').val();
            if ($scope.search.hotel == null) {
                $scope.search.hotel = $scope.properties_bedrooms[$scope.bedroom_id];
            }

            if ($scope.search.from == null || $scope.search.from == '' || $scope.search.from == 'undefined') {
                $('#calendarBookingFrom').trigger('click');
                return;
            }
            if ($scope.search.to == null || $scope.search.to == '' || $scope.search.to == 'undefined') { return; }
            if ($scope.search.from != 'undefined-undefined-' && $scope.search.to != 'undefined-undefined-' && $scope.search.from != null && $scope.search.to != null && $scope.search.adults > 0 && $scope.search.from != undefined && $scope.search.to != undefined && $scope.search.from != 'undefined' && $scope.search.to != 'undefined') {
                var other_guests = 0;
                var kids = [];
                if ($scope.search.kids > 0) {
                    $(".kidsSelect").each(function (index) {
                        var age = $(this).val();
                        kids.push(age);
                    });

                }
                $scope.search.guests = parseInt($scope.search.adults) + other_guests;
                if ($scope.search.guests > $scope.activeBedroom.capacityMax) {
                    $scope.error_adults = true;
                    return;
                }
                if (kids.length > $scope.activeBedroom.capacityKids) {
                    $scope.error_kids = true;
                    return;
                }

                var from_split = $scope.search.from.split('-');
                var from = from_split[2] + '-' + from_split[1] + '-' + from_split[0];
                var to_split = $scope.search.to.split('-');
                var to = to_split[2] + '-' + to_split[1] + '-' + to_split[0];
                var exit_url = $scope.booking_domain + '/search?hotel=' + $scope.search.hotel + '&from=' + from + '&to=' + to + '&guests=' + $scope.search.guests + '&rooms=' + $scope.search.rooms;
                if (kids.length > 0) {
                    exit_url = exit_url + '&kids=' + kids.join('-');
                }
                $window.location.href = exit_url;
            }
            return;
        }

        // transfers
        $scope.transfer_pick_up = null;
        $scope.transfer_dropp_off = '0';
        $scope.transfer_date = null;
        $scope.transfer_time = null;
        $scope.transfer_persons = 1;
        $scope.transfer_luggages = 0;
        $scope.transfer_dropp_offs = [];
        $scope.transferCalendar = null;
        $scope.transferOtherLoc = '';
        $scope.loadingPickUps = 0;

        $scope.initTransferModal = function (locale) {

            if ($scope.loadingPickUps == 1) {
                return;
            }
            $scope.loadingPickUp = 1;
            $scope.transfer_dropp_offs = [];
            if ($scope.transfer_pick_up == -1)
                $("#otherPickUpDiv").show();
            else
                $("#otherPickUpDiv").hide();

            endpoints.getTransferDroppOff(locale, $scope.transfer_pick_up).then(function (data) {

                if (data.drop_offs && data.drop_offs.length > 0) {
                    $scope.transfer_dropp_offs = data.drop_offs;
                }
                $scope.transfer_date = null;
                $scope.transfer_time = null;
                $scope.transfer_persons = 1;
                $scope.transfer_luggages = 0;
                if ($scope.transferCalendar != null) {
                    $('#transferCalendar').datepicker('remove');
                }
                $timeout(function () {
                    $scope.transferCalendar =
                        $('#transferCalendar').datepicker({
                            format: 'dd-mm-yyyy',
                            startDate: '-0d',
                            autoclose: true,
                            language: locale
                        }).on('changeDate', function (e) {
                            $(this).blur();
                            $(this).focus();
                            $(this).valid();
                        });

                }, 100);
                $scope.loadingPickUp = 1;
                $("#transferDropOff").val('0');
                $("#transferCalendar").val('');
                $("#transferTimePicker").val('');
            });
        }

        $scope.transfer_time = null;
        //
        $scope.checkTime = function () {
            var a = $('#transferTimePicker').val();
            if (a.length > 0) {
                return true;
            }
            return false;
        };
        $scope.excursions_booking_list_domain = null;
        $scope.findTransferAvailability = function () {
            var transfer_time = $('#transferTimePicker').val();
            if (($scope.transfer_pick_up > 0 || $scope.transfer_pick_up == -1) && ($scope.transfer_dropp_off > 0 || $scope.transfer_dropp_off == -1) && $scope.transfer_date != null && transfer_time != null && $scope.transfer_persons > 0 && $scope.transfer_luggages >= 0) {
                $scope.sending_booking = 1;
                var exit_url = $scope.excursions_booking_list_domain + '?pick=' + $scope.transfer_pick_up + '&drop=' + $scope.transfer_dropp_off + '&date=' + $scope.transfer_date + '&time=' + transfer_time + '&persons=' + $scope.transfer_persons + '&luggages=' + $scope.transfer_luggages;
                if ($scope.transfer_dropp_off == -1 && $scope.transferOtherLoc.length > 0) {
                    exit_url = exit_url + "&customLocation=" + $scope.transferOtherLoc;
                }
                if ($scope.transfer_pick_up == -1 && $scope.transferOtherPickUp.length > 0) {
                    exit_url = exit_url + "&customPickUp=" + $scope.transferOtherPickUp;
                }
                $window.location.href = exit_url + "&pd=" + $scope.page_id;
            }
        }
        $scope.initTransferSelect = function (id) {
            $scope.transfer_pick_up = id;
        }

        // end transfers

        // Excursions

        $scope.excursions_booking_domain = null;
        $scope.guests = 1;
        $scope.kids = 0;
        $scope.infants = 0;
        $scope.from = null;
        $scope.to = null;
        $scope.pricing = null;





        $scope.excursion_id;
        $scope.fetchExcursionsCalendar = function (id, category_id, min) {
            $scope.excursion_id = id;
            if (category_id) {
                $scope.category = category_id;
            }
            if (min == null || min === 'undefined') {
                min = $scope.guests;
            }
            $scope.fetchExcursionsData(min);
        }



        $scope.fetchExcursionsData = function (min) {
            $scope.guests = min;
            $scope.kids = 0;
            $scope.infants = 0;
            if ($scope.start_range == null) {
                var startDate = moment();
                var startDateFormatted = startDate.format('YYYY/MM/DD');
                var endDate = angular.copy(startDate);
                endDate.add(12, "month").endOf('month');
                var endDateFormatted = endDate.format('YYYY/MM/DD');
                $scope.start_range = startDateFormatted;
                $scope.end_range = endDateFormatted;
            }



            var itr = moment.twix(new Date($scope.start_range), new Date($scope.end_range)).iterate("days");
            var range = [];
            while (itr.hasNext()) {
                range.push(itr.next())
            }
            $scope.date_range = range;

            $scope.data = [];
            for (var i = 0; i < $scope.date_range.length; i++) {
                var item = $scope.date_range[i];
                var bed = $scope.excursion_id;
                if (typeof ($scope.data[bed]) === 'undefined') {
                    $scope.data[bed.toString()] = {};
                }
                var obj = {};
                obj.loading = 1;
                obj.status = null;
                obj.price = null;
                $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()] = obj;
            }

            var excursions_ids = $scope.excursion_id;
            var guests = $scope.guests;



            endpoints.getExperiensesPlans(excursions_ids, $scope.start_range.split('/').join('-'), $scope.end_range.split('/').join('-'), guests, $scope.kids, $scope.infants).then(function (plans) {
                $scope.excludes = [];
                for (var i = 0; i < $scope.date_range.length; i++) {
                    var item = $scope.date_range[i];
                    var bed = $scope.excursion_id;

                    if ($.inArray(bed.toString() + '__' + $scope.formatDate(item, 'YYYY-MM-DD').toString(), $scope.excludes) != -1) {
                        delete $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()];
                        continue;
                    }

                    if (typeof (plans[bed]) !== 'undefined') {
                        var objec = plans[bed.toString()][$scope.formatDate(item, 'YYYY-MM-DD').toString()];
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].colspan = 1;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].date = item;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].loading = 0;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].status = objec.status;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].price = objec.price;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].price_infants = objec.price_infants;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].price_kids = objec.price_kids;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].capacity_adults = objec.capacity_adults;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].capacity_kids = objec.capacity_kids;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].capacity_infants = objec.capacity_infants;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].pax_adults = objec.pax_adults;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].pax_kids = objec.pax_kids;
                        $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()].pax_infants = objec.pax_infants;
                        if ($.inArray(bed.toString() + '__' + $scope.formatDate(item, 'YYYY-MM-DD').toString(), $scope.excludes) != -1) {
                            delete $scope.data[bed.toString()][$scope.formatDate(item, 'YYYYMMDD').toString()];
                        }
                    }
                }
                $scope.initExcursionsNewBooking();
            });
        };

        $scope.checkKids = function () {
            $scope.error_kids = false;
            var other_guests = 0;
            var kids = [];
            $timeout(function () {
                if ($scope.search.kids > 0) {
                    $(".kidsSelect_" + $scope.excursion_id).each(function (index) {
                        var age = $(this).val();
                        kids.push(age);
                    });
                }
                $scope.search.guests = parseInt($scope.search.adults) + other_guests;
                if (kids.length > $scope.activeBedroom.capacityKids) {
                    $scope.error_kids = true;
                    return;
                }
                $scope.chunkKids();
            }, 300);

        };

        $scope.initExcursionsNewBooking = function () {
            $scope.selectedBookingStart.loading = 1;
            $scope.selectedBookingStart.excursion_id = $scope.excursion_id;
            $scope.selectedBookingStart.date = $scope.formatDate(moment(), 'DD-MM-YYYY');
            $scope.selectedBookingStart.ddate = $scope.formatDate(moment(), 'YYYY-MM-DD');
            $scope.selectedBookingStart.raw_date = moment();

            $scope.selectedBookingEnd = {
                bedroom_id: null,
                date: null,
                raw_date: null,
                property: null,
            };

            if ($scope.selectedDatepickerBookingFrom != null) {
                $('#calendarBookingFrom_' + $scope.excursion_id).datepicker('remove');
            }

            $scope.selectedDatepickerFrom =
                $('#calendarBookingFrom_' + $scope.excursion_id).datepicker({
                    format: 'dd-mm-yyyy',
                    startDate: '-0d',
                    autoclose: true,
                    beforeShowDay: function (date) {
                        var dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
                        var mm = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1; //January is 0!
                        var yyyy = date.getFullYear();
                        var shortDate = dd + '/' + mm + '/' + yyyy;
                        var formatted = yyyy + '-' + mm + '-' + dd;
                        var mo = moment(formatted);
                        var check = $scope.showExcursionsClass(mo, $scope.selectedBookingStart.excursion_id);
                        switch (check) {
                            case 1:
                                return { enabled: true }
                                break;
                            default:
                                return { enabled: false, classes: "full-reserve" }
                                break;
                        }
                    }
                });

            var endDate = angular.copy($scope.selectedBookingStart.raw_date);
            endDate.add(12, "month").endOf('month');
            var endDateFormatted = endDate.format('YYYY-MM-DD');
            var startDateFormatted = $scope.selectedBookingStart.raw_date.format('YYYY-MM-DD');

            $timeout(function () {
                $('#bookingForm').validate();
            }, 200);
        };

        $scope.showExcursionsClass = function (date, bed) {
            if (typeof ($scope.data[bed.toString()]) !== 'undefined' && typeof ($scope.data[bed][$scope.formatDate(date, 'YYYYMMDD').toString()]) !== 'undefined') {
                var item = $scope.data[bed][$scope.formatDate(date, 'YYYYMMDD').toString()];
                var status = $scope.data[bed][$scope.formatDate(date, 'YYYYMMDD').toString()].status;
                if (parseInt(status) == 1) {
                    var available_adults = parseInt(item.capacity_adults) - parseInt(item.pax_adults);
                    var available_kids = parseInt(item.capacity_kids) - parseInt(item.pax_kids);
                    if (($scope.guests + $scope.kids) > (available_adults + available_kids)) {
                        return 2;
                    }
                }
                return status;
            }

            return 2;
        };


        $scope.extra_excursions = [];

        $scope.intExtraExcursions = function (ex_id, ex_ex_id) {
            var d = {
                excursion_id: ex_id,
                extra_excursion_id: ex_ex_id
            }

            $scope.extra_excursions.push(d);

        }

        $scope.error_kids = false;
        $scope.error_adults = false;
        $scope.sending_booking = 0;
        $scope.category = null;
        $scope.color = null;
        $scope.excursion_plan = null;
        $scope.extra_excursion = null;

        $scope.findExcursionsAvailability = function () {
            if ($scope.page_id == 855) {
                $scope.sending_booking = 1;
                var kids = [];
                if ($scope.kids > 0) {
                    $(".kidsSelect_" + $scope.excursion_id).each(function (index) {
                        var age = $(this).val();
                        kids.push(age);
                    });
                }
                $scope.search.guests = parseInt($scope.guests);
                $scope.search.infants = parseInt($scope.infants);
                var exit_url = $scope.excursions_booking_domain + '?excursion=' + $scope.excursion_id + '&date=' + $scope.search.from + '&guests=' + $scope.search.guests;
                if (kids.length > 0) {
                    exit_url = exit_url + '&kids=' + kids.join('-');
                }
                if ($scope.category != null) {
                    exit_url = exit_url + '&category=' + $scope.category;
                }
                if ($scope.color != null) {
                    exit_url = exit_url + '&color=' + $scope.color;
                }
                if ($scope.excursion_plan != null) {
                    exit_url = exit_url + '&plan=' + $scope.excursion_plan;
                }

                if ($scope.extra_excursions.length > 0) {
                    for (var i = 0; i < $scope.extra_excursions.length; i++) {
                        if ($scope.extra_excursions[i].excursion_id == $scope.excursion_id) {
                            $scope.extra_excursion = $scope.extra_excursions[i].extra_excursion_id;
                        }
                    }
                }

                if ($scope.extra_excursion != null) {
                    exit_url = exit_url + '&extra_excursion=' + $scope.extra_excursion;
                }

                $window.location.href = exit_url;
            } else {

                $scope.search.from = $('#calendarBookingFrom_' + $scope.excursion_id).val();
                if ($scope.search.from == null || $scope.search.from == '' || $scope.search.from == 'undefined') {
                    $('#calendarBookingFrom_' + $scope.excursion_id).trigger('click');
                    return;
                }
                if ($scope.search.from != 'undefined' && $scope.search.from != null && $scope.guests > 0 && $scope.search.from != undefined && $scope.search.from != 'undefined') {
                    $scope.sending_booking = 1;
                    var kids = [];
                    if ($scope.kids > 0) {
                        $(".kidsSelect_" + $scope.excursion_id).each(function (index) {
                            var age = $(this).val();
                            kids.push(age);
                        });

                    }

                    $scope.search.guests = parseInt($scope.guests);
                    $scope.search.infants = parseInt($scope.infants);

                    var exit_url = $scope.excursions_booking_domain + '?excursion=' + $scope.excursion_id + '&date=' + $scope.search.from + '&guests=' + $scope.search.guests;
                    if (kids.length > 0) {
                        exit_url = exit_url + '&kids=' + kids.join('-');
                    }
                    if ($scope.category != null) {
                        exit_url = exit_url + '&category=' + $scope.category;
                    }

                    $window.location.href = exit_url;
                }
            }
            return;
        };

        $scope.initrangeExcursions = function () {
            $scope.rangeExcursions(1, $scope.kids);
        }
        $scope.exkidsarray = [];
        $scope.rangeExcursions = function (min, max) {
            min = parseInt(min);
            max = parseInt(max);
            $scope.exkidsarray = [];
            for (var i = min; i <= max; i++) {
                $scope.exkidsarray.push(i);
            }
            return true;
        };

        // End Excursions
        $scope.property = null;


        $scope.fetchingBedroomsModalContent = 0;
        $scope.bedroomsModalContent = null;
        $scope.loadBedroomsModal = function (locale, total_bedrooms, bedroom_id, bedroom_title, property_id = null) {
            if ($scope.fetchingBedroomsModalContent == 1) {
                return false;
            }
            $scope.loadingBedrooms = 0;
            $('#bedrooms_modal').modal('show');
            if ($scope.bedroomsModalContent == null) {
                $scope.loadingBedrooms = 1;
                $scope.fetchingBedroomsModalContent = 1;
                if (property_id != null) {
                    $scope.property = property_id;
                }
                endpoints.getBedroomsModal(locale, $scope.property).then(function (data) {
                    $scope.bedroomsModalContent = data;
                    $('#bedrooms_modal').append($scope.bedroomsModalContent);
                    $scope.initBedroomsModal(total_bedrooms, bedroom_id, bedroom_title);
                    $scope.fetchingBedroomsModalContent = 0;
                    $scope.loadingBedrooms = 0;

                    $('[data-init-reponsive-tabs="dropdownfx"]').each(function () {
                        var drop = $(this);
                        drop.addClass("hidden-sm hidden-xs");
                        var content = '<select class="cs-select cs-skin-slide full-width" data-init-plugin="cs-select">'
                        for (var i = 1; i <= drop.children("li").length; i++) {
                            var li = drop.children("li:nth-child(" + i + ")");
                            var selected = "";
                            if (li.hasClass("active")) {
                                selected = "selected";
                            }
                            content += '<option value="' + li.children('a').attr('href') + '" ' + selected + '>';
                            content += li.children('a').text();
                            content += '</option>';
                        }
                        content += '</select>'
                        drop.after(content);
                        var select = drop.next()[0];
                        $(select).on('change', function (e) {
                            var optionSelected = $("option:selected", this);
                            var valueSelected = this.value;
                            drop.find('a[href="' + valueSelected + '"]').tab('show')
                        })
                        $(select).wrap('<div class="nav-tab-dropdown cs-wrapper full-width p-t-10 visible-xs visible-sm"></div>');
                        new SelectFx(select);
                    });
                    $.fn.tabCollapse && $('[data-init-reponsive-tabs="collapse"]').tabCollapse();
                });
            } else {
                $scope.initBedroomsModal(total_bedrooms, bedroom_id, bedroom_title);
            }
        };
        endpoints.getBedroomsModal = function (locale, property_id) {
            return new Promise(function (resolve) {
                const mockHtml = `
<div class="modal-dialog modal-md" role="document" style="width:100%;max-width:600px;">
    <div class="modal-content" style="height:auto !important;min-height:100%;">
        <div class="modal-header clearfix text-left">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true" aria-label="Close">
                <em class="pg-close fs-18 p-t-10" aria-hidden="true"></em>
            </button>
            <h2 class="text-overflow">Available Bedrooms</h2>
        </div>
        <div class="modal-body">
            <div class="panel">
                <div class="nav-tabs-header nav-tabs-linetriangle">
                    <ul class="nav nav-tabs nav-tabs-linetriangle" data-init-reponsive-tabs="dropdownfx">
                        <li class="active bedroomTab" id="bedroom45068Tab">
                            <a data-toggle="tab" href="#bedroom45068TabContent" onclick="setTimeout(function(){window.dispatchEvent(new Event('resize'));},1000);">
                                <span>Bedroom 1
                                                    </span>
                            </a>
                        </li>
                        <li class=" bedroomTab" id="bedroom45069Tab">
                            <a data-toggle="tab" href="#bedroom45069TabContent" onclick="setTimeout(function(){window.dispatchEvent(new Event('resize'));},1000);">
                                <span>Bedroom 2
                                                    </span>
                            </a>
                        </li>
                        <li class=" bedroomTab" id="bedroom45070Tab">
                            <a data-toggle="tab" href="#bedroom45070TabContent" onclick="setTimeout(function(){window.dispatchEvent(new Event('resize'));},1000);">
                                <span>Bedroom 3
                                                    </span>
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="tab-content">
                    <div class="tab-pane bedroomTabContent active" id="bedroom45068TabContent">
                        <div class="swiper swiper-container-bedroom1 swiper-init m-b-30 test-1" id="swiper-container-bedroom1" style="height: 308px;">
                            <div class="swiper-wrapper">
                                <div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45068" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/667a0e341a65126ae163c48ce618713d.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/667a0e341a65126ae163c48ce618713d_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                         <div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45068" href="/assets/images/pueblo/20 Indoor-50master bedroom (1).jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/20 Indoor-50master bedroom (1).jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                 <div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45068" href="/assets/images/pueblo/18 Indoor-50master bedroom (2).jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/18 Indoor-50master bedroom (2).jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45068" href="/assets/images/pueblo/19 Indoor-50master bedroom (3).jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/19 Indoor-50master bedroom (3).jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45068" href="/assets/images/pueblo/21 Indoor-50master bedroom (4).jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/21 Indoor-50master bedroom (4).jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="p-t-20 p-b-10">
                            <div class="row m-t-20"></div>
                        </div>
                        <h4 class="text-overflow">Beds</h4>
                        <div class="row m-t-20">
                            <div class="col-md-6 m-b-10">
                                &bull;Double: <b>1</b>
                            </div>
                        </div>
                        <div class="row m-t-20"></div>
                        <!-- FOR FEATURES -->
                        <!-- FOR CHILDREN -->
                    </div>
                    <div class="tab-pane bedroomTabContent " id="bedroom45069TabContent">
                        <div class="swiper swiper-container-bedroom2 swiper-init m-b-30 test-1" id="swiper-container-bedroom2" style="height: 308px;">
                            <div class="swiper-wrapper">
                                <div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/b1d9bc5d9cd3726339e9a93cf8c72719.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/b1d9bc5d9cd3726339e9a93cf8c72719_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div class="swiper-slide fit slide2" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/08be24c26f7971b1ab517fed2fa1979d.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/08be24c26f7971b1ab517fed2fa1979d_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div class="swiper-slide fit slide3" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/b8e59d3fd1b433fed397cb80863b9bcb.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/b8e59d3fd1b433fed397cb80863b9bcb_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div class="swiper-slide fit slide4" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/d70136de7002464e050e9c4b80e66d51.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/d70136de7002464e050e9c4b80e66d51_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
 <div class="swiper-slide fit slide4" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="/assets/images/pueblo/bed_2_1.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_2_1.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
<div class="swiper-slide fit slide4" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="/assets/images/pueblo/bed_2_2.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_2_2.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
<div class="swiper-slide fit slide4" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="/assets/images/pueblo/bed_2_3.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_2_3.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
<div class="swiper-slide fit slide4" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45069" href="/assets/images/pueblo/bed_2_4.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_2_4.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <div class="mouse-wrapper visible-xs">
                                <div class="mouse">
                                    <div class="mouse-scroll"></div>
                                </div>
                            </div>
                            <div class="swiper-navigation swiper-dark-solid swiper-button-prev swiper-button-prev-bedroom2  hidden-xs"></div>
                            <div class="swiper-navigation swiper-dark-solid swiper-button-next swiper-button-next-bedroom2  hidden-xs"></div>
                        </div>
                        <div class="p-t-20 p-b-10">
                            <div class="row m-t-20"></div>
                        </div>
                        <h4 class="text-overflow">Beds</h4>
                        <div class="row m-t-20">
                            <div class="col-md-6 m-b-10">
                                &bull;Single: <b>2</b>
                            </div>
                        </div>
                        <div class="row m-t-20"></div>
                        <!-- FOR FEATURES -->
                        <!-- FOR CHILDREN -->
                    </div>
                    <div class="tab-pane bedroomTabContent " id="bedroom45070TabContent">
                        <div class="swiper swiper-container-bedroom3 swiper-init m-b-30 test-1" id="swiper-container-bedroom3" style="height: 308px;">
                            <div class="swiper-wrapper">
                                <div class="swiper-slide fit slide1" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/d74630947fc91a8d31e58428decdb89b.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/d74630947fc91a8d31e58428decdb89b_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div class="swiper-slide fit slide2" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/34fc7e54a188703bb8ccca740fa569e1.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/34fc7e54a188703bb8ccca740fa569e1_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div class="swiper-slide fit slide3" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/4be6a73daee4fc38a8070e77116a8a58.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/4be6a73daee4fc38a8070e77116a8a58_thumb.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
 <div class="swiper-slide fit slide3" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="/assets/images/pueblo/bed_3_1.jpg" title=""> 'EDW
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_3_1.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
 <div class="swiper-slide fit slide3" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="/assets/images/pueblo/bed_3_2.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_3_2.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
 <div class="swiper-slide fit slide3" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="/assets/images/pueblo/bed_3_3.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_3_3.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
 <div class="swiper-slide fit slide3" style="cursor: pointer;">
                                    <a class="fancybox" title="fancyBox" data-fancybox="fancyBedroomImages45070" href="/assets/images/pueblo/bed_3_4.jpg" title="">
                                        <span style="display: none;">Bedroom Image</span>
                                        <div class="slider-wrapper">
                                            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/bed_3_4.jpg"></div>
                                        </div>
                                        <div class="content-layer">
                                            <div class="inner full-height">
                                                <div class="container-xs-height full-height">
                                                    <div class="col-xs-height col-bottom  text-center">
                                                        <div class="container full-width">
                                                            <div class="row full-width">
                                                                <div class="col-md-12">
                                                                    <p class="text-white text-left pull-le m-r-10"></p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <div class="mouse-wrapper visible-xs">
                                <div class="mouse">
                                    <div class="mouse-scroll"></div>
                                </div>
                            </div>
                            <div class="swiper-navigation swiper-dark-solid swiper-button-prev swiper-button-prev-bedroom3  hidden-xs"></div>
                            <div class="swiper-navigation swiper-dark-solid swiper-button-next swiper-button-next-bedroom3  hidden-xs"></div>
                        </div>
                        <div class="p-t-20 p-b-10">
                            <div class="row m-t-20"></div>
                        </div>
                        <h4 class="text-overflow">Beds</h4>
                        <div class="row m-t-20">
                            <div class="col-md-6 m-b-10">
                                &bull;Double: <b>1</b>
                            </div>
                        </div>
                        <div class="row m-t-20"></div>
                        <!-- FOR FEATURES -->
                        <!-- FOR CHILDREN -->
                    </div>
                </div>
            </div>
        </div>
`;
                resolve(mockHtml);
            });
        };

        $scope.initBedroomsModal = function (total_bedrooms, bedroom_id, bedroom_title) {

            $timeout(function () {
                if (bedroom_id != null && bedroom_title != null) {
                    $('.bedroomTab').removeClass('active');
                    $('.bedroomTabContent').removeClass('active');
                    $('#bedroom' + bedroom_id + 'Tab').addClass('active');
                    $('#bedroom' + bedroom_id + 'TabContent').addClass('active');
                    $('#bedroom_name').text(bedroom_title);
                }

                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                for (var i = 1; i <= total_bedrooms; i++) {
                    new Swiper('.swiper-container-bedroom' + i, {
                        navigation: {
                            nextEl: '.swiper-button-next-bedroom' + i,
                            prevEl: '.swiper-button-prev-bedroom' + i,
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });
                }

            }, 300);
        }



        $scope.fetchingModalWrapperContent = 0;
        $scope.loadingWrapper = 0;
        $scope.loadArticlesModal = function (locale, article_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getArticleModal(locale, article_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {
                    new Swiper('.swiper-container-article' + article_id, {
                        navigation: {
                            nextEl: '.swiper-button-next-article',
                            prevEl: '.swiper-button-prev-article',
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });

                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };

        $scope.loadArticleImagesModal = function (locale, article_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getArticleImagesModal(locale, article_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {
                    new Swiper('.swiper-container-article' + article_id, {
                        lazy: true
                    });

                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };

        $scope.loadMobileArticlesModal = function (locale, article_id) {
            if (window.matchMedia("(max-width: 576px)").matches) {

                if ($scope.fetchingModalWrapperContent == 1) {
                    return false;
                }
                $('#modal_wrapper').modal('show');
                $scope.loadingWrapper = 1;
                $('#modal_wrapper .modal-dialog.modal-md').remove();
                $scope.fetchingModalWrapperContent = 1;
                endpoints.getArticleMobileModal(locale, article_id).then(function (data) {
                    $scope.loadingWrapper = 0;
                    $('#modal_wrapper').append(data);
                    setTimeout(function () {
                        window.dispatchEvent(new Event('resize'));
                    }, 1000);
                    $timeout(function () {
                        new Swiper('.swiper-container-article' + article_id, {
                            lazy: true
                        });

                    }, 300);
                    $scope.fetchingModalWrapperContent = 0;
                });
            }
        };
        $scope.mockLoadArticle = function () {
            console.log('Mock triggered!');
            // Your mock logic here
        };
        $scope.loadPoolModal = function (locale, pool_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getPoolModal(locale, pool_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {

                    new Swiper('.swiper-container-pool', {
                        navigation: {
                            nextEl: '.swiper-button-next-pool',
                            prevEl: '.swiper-button-prev-pool',
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });
                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };
        endpoints.getPoolModal = function (locale, pool_id) {
            return new Promise(function (resolve) {
                const mockHtml = `
<div class="modal-dialog modal-md" role="document" style="width:100%;max-width:600px;">
    <div class="modal-content" style="height:auto !important;min-height:100%">
        <div class="modal-header clearfix text-left">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true" aria-label="Close">
                <em class="pg-close fs-18 p-t-10" aria-hidden="true"></em>
            </button>
            <h2 class="text-overflow">Outdoor Pool</h2>
        </div>
        <div class="modal-body p-t-20">
            <!-- images: modals/pool -->
            <div class="swiper swiper-container-pool swiper-init m-b-30" style="height: 308px;">
                <div class="swiper-wrapper">
                    <div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/7c18e5f4cd0e6eb3924f5df87e869564.jpg" data-caption="">
                            <span style="display: none;">Pool Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/7c18e5f4cd0e6eb3924f5df87e869564_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide2" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/7c3e5392a893be946976561aaf05ee8c.jpg" data-caption="">
                            <span style="display: none;">Pool Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/7c3e5392a893be946976561aaf05ee8c_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/1-Outdoor-11.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/1-Outdoor-11_thumb.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/5 Outdoor-40-sunset.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/5 Outdoor-40-sunset.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/pool_1_1.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/pool_1_1.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/pool_1_2.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/pool_1_2.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/pool_1_3.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/pool_1_3.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/pool_1_4.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/pool_1_4.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>
<div class="swiper-slide fit slide2" style="cursor: pointer;">
    <a class="fancybox" title="fancyBox" data-fancybox="fancyPoolImages3776" href="/assets/images/pueblo/pool_1_5.jpg" data-caption="">
        <span style="display: none;">Pool Image</span>
        <div class="slider-wrapper">
            <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/pool_1_5.jpg"></div>
        </div>
        <div class="content-layer">
            <div class="inner full-height">
                <div class="container-xs-height full-height">
                    <div class="col-xs-height col-bottom text-center">
                        <div class="container full-width">
                            <div class="row full-width">
                                <div class="col-md-12">
                                    <p class="text-white text-left pull-left m-r-10"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a>
</div>

                <div class="mouse-wrapper visible-xs">
                    <div class="mouse">
                        <div class="mouse-scroll"></div>
                    </div>
                </div>
                <div class="swiper-navigation swiper-dark-solid swiper-button-prev swiper-button-prev-pool hidden-xs"></div>
                <div class="swiper-navigation swiper-dark-solid swiper-button-next swiper-button-next-pool hidden-xs"></div>
            </div>
            <!-- modals/pool.html -->
            <div class="p-t-10">
                <!-- pool_desc -->
                <!-- pool_type -->
                <p>
                    &bull;Type: <b>Exterior</b>
                </p>
            </div>
            <!-- FOR FEATURES -->
            <!-- FOR CHILDREN -->
        </div>
    </div>
</div>

        `;
                setTimeout(() => resolve(mockHtml), 300);
            });
        };




        $scope.loadSpaceModal = function (locale, space_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getSpaceModal(locale, space_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {

                    new Swiper('.swiper-container-space', {
                        navigation: {
                            nextEl: '.swiper-button-next-space',
                            prevEl: '.swiper-button-prev-space',
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });
                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };
        endpoints.getSpaceModal = function (locale, space_id) {
            console.log(space_id);

            return new Promise(function (resolve) {
                let mockHtml;

                if (space_id === 27935) {
                    mockHtml = `<div class="modal-dialog modal-md" role="document" style="width:100%;max-width:600px;">
    <div class="modal-content" style="height:auto !important;min-height:100%">
        <div class="modal-header clearfix text-left">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true" aria-label="Close">
                <em class="pg-close fs-18 p-t-10" aria-hidden="true"></em>
            </button>
            <h2 class="text-overflow">Kitchen</h2>
        </div>
        <div class="modal-body p-t-20">
            <!-- images -->
            <div class="swiper swiper-container-space swiper-init m-b-30" style="height: 308px;">
                <div class="swiper-wrapper">
                    <div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_1.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_1.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_2.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_2.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_3.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_3.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_4.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_4.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_5.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_5.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_6.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_6.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_7.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_7.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_8.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_8.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_9.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_9.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_10.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_10.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="/assets/images/pueblo/Indoor_1_11.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Indoor_1_11.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27935" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/17ed137e30e76895c046a35fc2e4d76d.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/17ed137e30e76895c046a35fc2e4d76d_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            <div class="p-t-10">
                <p>
                    &bull;Place:<b>Indoor
                                            </b>
                </p>
            </div>
            <!-- FOR FEATURES -->
            <!-- FOR CHILDREN -->
        </div>
    </div>
</div>

`;
                } else {
                    mockHtml = `<div class="modal-dialog modal-md" role="document" style="width:100%;max-width:600px;">
    <div class="modal-content" style="height:auto !important;min-height:100%">
        <div class="modal-header clearfix text-left">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true" aria-label="Close">
                <em class="pg-close fs-18 p-t-10" aria-hidden="true"></em>
            </button>
            <h2 class="text-overflow">Outdoor Area</h2>
        </div>
        <div class="modal-body p-t-20">
            <!-- images -->
            <div class="swiper swiper-container-space swiper-init m-b-30" style="height: 308px;">
                <div class="swiper-wrapper">
                    <div class="swiper-slide fit slide1" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/ba708bd7dc2cbb8b64977cf20f4ec861.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/ba708bd7dc2cbb8b64977cf20f4ec861_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide2" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/04e90bb42de2b926c648ce6e5704229e.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/04e90bb42de2b926c648ce6e5704229e_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide3" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/99d3fc4004d407f0c467c952f346b1d0.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/99d3fc4004d407f0c467c952f346b1d0_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide4" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/9bb636064df7dc9349505609539b42a7.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/9bb636064df7dc9349505609539b42a7_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide5" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/166b739a7dafd6de9602abe7280609a6.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/166b739a7dafd6de9602abe7280609a6_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide6" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/2dad268fa3022413f660751587dd0d99.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/2dad268fa3022413f660751587dd0d99_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/525b70c397a840dfc511e7a54c361471.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="https://s3-eu-central-1.amazonaws.com/loggia-cdn/lodgeContent/525b70c397a840dfc511e7a54c361471_thumb.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_13.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_13.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_1.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_1.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_2.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_2.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_3.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_3.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_4.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_4.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_5.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_5.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_6.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_6.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_7.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_7.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_8.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_8.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_9.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_9.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_10.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_10.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_11.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_11.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_12.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_12.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_14.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_14.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_15.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_15.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_16.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_16.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_17.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_17.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_18.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_18.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_19.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_19.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_20.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_20.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_21.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_21.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_22.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_22.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_23.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_23.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_24.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_24.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_25.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_25.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_26.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_26.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_27.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_27.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_28.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_28.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_29.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_29.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_30.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_30.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_31.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_31.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_32.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_32.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_33.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/pueblo/Outdoor_1_33.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
<div class="swiper-slide fit slide7" style="cursor: pointer;">
                        <a class="fancybox" title="fancyBox" data-fancybox="fancySpaceImages27936" href="/assets/images/pueblo/Outdoor_1_34.jpg" data-caption="">
                            <span style="display: none;">Space Image</span>
                            <div class="slider-wrapper">
                                <div class="image swiper-lazy" data-swiper-parallax="30%" data-pages-bg-image data-background="/assets/images/Outdoor_1_34.jpg"></div>
                            </div>
                            <div class="content-layer">
                                <div class="inner full-height">
                                    <div class="container-xs-height full-height">
                                        <div class="col-xs-height col-bottom  text-center">
                                            <div class="container full-width">
                                                <div class="row full-width">
                                                    <div class="col-md-12">
                                                        <p class="text-white text-left pull-left m-r-10"></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
                <div class="mouse-wrapper visible-xs">
                    <div class="mouse">
                        <div class="mouse-scroll"></div>
                    </div>
                </div>
                <div class="swiper-navigation swiper-dark-solid swiper-button-prev swiper-button-prev-space hidden-xs"></div>
                <div class="swiper-navigation swiper-dark-solid swiper-button-next swiper-button-next-space hidden-xs"></div>
            </div>
            <div class="p-t-10">
                <p>
                    &bull;Place:<b>Outdoor
                                            </b>
                </p>
            </div>
            <!-- FOR FEATURES -->
            <!-- FOR CHILDREN -->
        </div>
    </div>
</div>
`;
                }

                resolve(mockHtml);
            });
        };

        $scope.loadDirectionsModal = function (locale, property_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $scope.loadingWrapper = 1;
            $('#modal_wrapper').modal('show');
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getDirectionsModal(locale, property_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);

                $scope.fetchingModalWrapperContent = 0;
            });
        };

        $scope.loadFeatureGroupModal = function (locale, feature_id, property_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getFeatureGroupModal(locale, feature_id, property_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {
                    new Swiper('.swiper-container-group' + feature_id, {
                        navigation: {
                            nextEl: '.swiper-button-next-group',
                            prevEl: '.swiper-button-prev-group',
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });

                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };
        endpoints.getFeatureGroupModal = function (locale, feature_id, property_id) {
            return new Promise((resolve) => {
                let mockedHtml = '';
                console.log('Requested feature_id:', feature_id);
                if (feature_id === 3) {
                    mockedHtml = `
<div class="modal-dialog" role="document" style="width:100%;max-width:600px;">
    <div class="modal-content-wrapper">
        <div class="modal-content" style="height:auto !important;min-height:100%">
            <div class="modal-header clearfix text-left">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true" aria-label="Close">
                    <em class="pg-close fs-18 p-t-10" aria-hidden="true"></em>
                </button>
                <h2 class="text-overflow">Entertainment / Activities</h2>
            </div>
            <div class="modal-body p-t-20">
                <div class="row m-t-30">
                    <div class="col-md-12">
                        <div>
                            <div class="block-title p-b-15 text-black">Entertainment
            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Television

                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Satellite/Cable TV

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Games for kids

                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Children &#039;s toys

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Board games/puzzles

                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Books for kids

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row m-t-30">
                    <div class="col-md-12">
                        <div>
                            <div class="block-title p-b-15 text-black">Sports and Adventure
            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Snorkeling

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
                } else if (feature_id === 6) {
                    mockedHtml = `
<div class="modal-dialog" role="document" style="width:100%;max-width:600px;">
    <div class="modal-content-wrapper">
        <div class="modal-content" style="height:auto !important;min-height:100%">
            <div class="modal-header clearfix text-left">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true" aria-label="Close">
                    <em class="pg-close fs-18 p-t-10" aria-hidden="true"></em>
                </button>
                <h2 class="text-overflow">Safety / Security</h2>
            </div>
            <div class="modal-body p-t-20">
                <div class="row m-t-30">
                    <div class="col-md-12">
                        <div>
                            <div class="block-title p-b-15 text-black">Building safety
            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Fire extinguisher

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row m-t-30">
                    <div class="col-md-12">
                        <div>
                            <div class="block-title p-b-15 text-black">Tenants safety
            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Safe deposit box

                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Mosquito nets

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            First aid kit

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row m-t-30">
                    <div class="col-md-12">
                        <div>
                            <div class="block-title p-b-15 text-black">Privacy
            </div>
                            <div class="row m-t-10">
                                <div class="col-md-6">
                                    <div>
                                        <div>
                                            <i aria-hidden="true" class="fas fa-check m-r-10"></i>
                                            Private Entrance

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
                }

                resolve(mockedHtml);
            });
        };


        $scope.loadServiceModal = function (locale, service_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getServiceModal(locale, service_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {
                    new Swiper('.swiper-container-service', {
                        navigation: {
                            nextEl: '.swiper-button-next-service',
                            prevEl: '.swiper-button-prev-service',
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });

                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };

        $scope.loadNewModal = function (locale, new_id) {
            if ($scope.fetchingModalWrapperContent == 1) {
                return false;
            }
            $('#modal_wrapper').modal('show');
            $scope.loadingWrapper = 1;
            $('#modal_wrapper .modal-dialog').remove();
            $scope.fetchingModalWrapperContent = 1;
            endpoints.getNewModal(locale, new_id).then(function (data) {
                $scope.loadingWrapper = 0;
                $('#modal_wrapper').append(data);
                setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 1000);
                $timeout(function () {
                    new Swiper('.swiper-container-new', {
                        navigation: {
                            nextEl: '.swiper-button-next-new',
                            prevEl: '.swiper-button-prev-new',
                        },
                        loop: false,
                        parallax: true,
                        speed: 1000,
                        lazy: true
                    });

                }, 300);
                $scope.fetchingModalWrapperContent = 0;
            });
        };

        // $scope.getPoiMap = function(locale,poi_location_id,pages_location_map_id) {
        //     if($scope.fetchingModalWrapperContent==1){
        //         return false;
        //     }
        //     $('#modal_wrapper').modal('show');
        //     $scope.loadingWrapper = 1;
        //     // $('#poiLocation_modal_preloader').show();
        //     $('#modal_wrapper .modal-dialog.modal-md').remove();
        //     endpoints.getPoiModal(locale,poi_location_id,pages_location_map_id).then(function (data) {
        //         $scope.loadingWrapper = 0;
        //         // $('#poiLocation_modal_preloader').hide();
        //         $('#modal_wrapper').append(data);
        //         setTimeout(function(){window.dispatchEvent(new Event('resize'));},1000);
        //         $timeout(function () {
        //             new Swiper('.swiper-container-pagepoi', {
        //                 navigation: {
        //                     nextEl: '.swiper-button-next-pagepoi',
        //                     prevEl: '.swiper-button-prev-pagepoi',
        //                 },
        //                 loop: false,
        //                 parallax: true,
        //                 speed: 1000,
        //                 lazy: true
        //             });
        //         }, 300);
        //         $scope.fetchingModalWrapperContent = 0;
        //     });
        // };
    }]
);