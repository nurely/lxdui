App.images = App.images || {
    error: false,
    loading: false,
    data: [],
    remoteData: [],
    remotePaesslerData: [],
    activeTab:'local',
    tableLocal: null,
    tableRemote: null,
    tablePaesslerRemote: null,
    tableNightly: null,
    tableSettings: {
        searching:true,
        responsive: {
            details: false
        },
        select: true,
        autoWidth: true,
        columnDefs: [
            {
                orderable: false,
                className: 'select-checkbox',
                targets:   0
            }
        ],
         dom: "<'tbl-header'<'row'<'col-sm-4 text-left'f><'col-sm-2 refresh-list-place'><'col-sm-6 json-place'>>>" +
        "<'row'<'col-sm-12'tr>>" +
        "<'row'<'col-sm-4'i><'col-sm-2 text-right'l><'col-sm-6 text-right'p>>",
        "oLanguage": {
          "sLengthMenu": "List _MENU_ ",
        },
        select: {
            style:    'multi',
            selector: 'td:first-child'
        },
        order: [[ 1, 'asc' ]],
        initComplete: function(settings, json) {
            var tempButton = $('.rawJSONImages').clone();
            tempButton.removeClass('rawJSONImages');
            tempButton.on('click', $.proxy(App.images.showJSON, App.images));
            $('#'+$(this).closest('table').attr('id')+'_wrapper .json-place').prepend(tempButton);
            tempButton.show();
        },
    },
    containerTemplate:null,
    newContainerForm:null,
    itemTemplate:null,
    rawJson:null,
    init: function(opts){
        this.data = constLocalImages || [];
        this.remoteData = constRemoteImages || [];
        this.remotePaesslerData = constRemotePaesslerImages || [];
        this.containerTemplate = $('.multiContainerTemplate');
        this.rawJson = ace.edit('rawJson');
        this.rawJson.session.setMode('ace/mode/json');
        this.rawJson.setOptions({readOnly: true});
        $('#btnLocalImages').on('click', $.proxy(this.switchView, this, 'localList'));
        $('#btnRemoteImages').on('click', $.proxy(this.switchView, this, 'remoteList'));
        $('#btnRemotePaesslerImages').on('click', $.proxy(this.switchView, this, 'remotePaesslerList'));
        $('#btnNightlyImages').on('click', $.proxy(this.switchView, this, 'nightlyList'));

        $('#buttonUpdate').on('click', $.proxy(this.getData, this));
        $('#buttonDelete').on('click', $.proxy(this.doDeleteLocalImages, this));
        $('#buttonDownload').on('click', $.proxy(this.doDownload, this));
        $('#buttonDownloadPaessler').on('click', $.proxy(this.doDownload, this));
        $('#buttonDownloadNightly').on('click', $.proxy(this.doDownload, this));
        $('#buttonLaunchContainers').on('click', $.proxy(this.launchContainers, this));
        $('#buttonBack').on('click', $.proxy(this.switchView, this, 'localList'));
        $('.image').on('click', $.proxy(this.setActive, this));
        App.setActiveLink('image');
        this.newContainerForm = $('#newContainerForm');
        this.newContainerForm.on('submit', $.proxy(this.doCreateContainer, this));
        $('.imageSize').each(this.convertImageSize);
        this.initLocalTable();
        this.initRemoteTable();
        this.initRemotePaesslerTable();
        this.initNightlyTable();
        $('#selectAllLocal').on('change', $.proxy(this.toggleSelectAll, this, 'Local'));
        $('#selectAllRemote').on('change', $.proxy(this.toggleSelectAll, this, 'Remote'));
        $('#selectAllPaesslerRemote').on('change', $.proxy(this.toggleSelectAll, this, 'PaesslerRemote'));
        this.itemTemplate = $('.itemTemplate').clone();
        $('#modalDownloadButton').on('click', $.proxy(this.doDownload, this));
        $('#exTab2 > ul > li:nth-child(1)').addClass('active');// set first tab as active

        $('#architectureRemote').on('change', $.proxy(this.filterRemoteTable, this));
        $('#architecturePaesslerRemote').on('change', $.proxy(this.filterPaesslerRemoteTable, this));
        $('#architectureNightly').on('change', $.proxy(this.filterNightlyTable, this));

        this.initKeyValuePairs();
    },
    convertImageSize:function(index, item){
        $(item).text(App.formatBytes($(item).text()));
    },
    setLoading: function(state){
        var tempLoaderState = state?'show':'hide';
        var tempTableState = state?'hide':'show';
        $('#loader')[tempLoaderState]();
        if(this.activeTab == 'local')
            return $('#tableImagesLocalWrapper')[tempTableState]();
        else if (this.activeTab=='remote')
            return $('#tableImagesRemoteWrapper')[tempTableState]();
        else if (this.activeTab=='remotePaessler')
            return $('#tablePaesslerImagesRemoteWrapper')[tempTableState]();
    },
    initKeyValuePairs: function() {
        for (key in App.properties.keyValues) {
            $('#advancedSettingsMultipleContainer').append('<div class="row">' +
                    '<div class="col-lg-1"></div>'+
                    '<div class="col-lg-4">'+
                        '<div class="form-group row">' +
                            '<input type="text" class="form-control" placeholder="' + key + '"  disabled />' +
                            '<a href="#" class="hover-info" onmouseover="$.proxy(App.containerDetails.showPopover(this));" title="Information" data-toggle="popover" data-trigger="hover" data-content="'+ App.properties.keyValues[key].description + '" data-original-title="Information">' +
                                 '<span class="glyphicon glyphicon-info-sign"></span>' +
                             '</a>' +
                        '</div>' +
                    '</div>'+
                    '<div class="col-lg-1"></div>'+
                    '<div class="col-lg-4">' +
                        '<div class="form-group row">' +
                            '<input type="text" name="'+ key +'" id="' + key + '" class="form-control" placeholder="" value="" disabled />' +
                        '</div>' +
                    '</div>' +
                     '<div class="col-lg-2">' +
                         '<div class="btn-group" role="group">' +
                            '<button type="button" id="" class="formModifier btn btn-sm btn-default" onClick="$.proxy(App.containerDetails.enableInput(this));">On</button>' +
                            '<button type="button" id="" class="formModifier btn btn-sm btn-danger" onClick="$.proxy(App.containerDetails.disableInput(this));">Off</button>' +
                        '</div>' +
                     '</div>' +
                '</div>');
        }
    },
    initLocalTable: function(){
        this.tableLocal =$('#tableImagesLocal').DataTable(App.mergeProps(this.tableSettings, {rowId: 'fingerprint'}));
        this.setLocalTableEvents();
    },
    setLocalTableEvents: function(){
        this.tableLocal.on('select', $.proxy(this.onItemSelectChange, this));
        this.tableLocal.on('deselect', $.proxy(this.onItemSelectChange, this));
    },
    initRemoteTable: function(){
        this.tableRemote =$('#tableImagesRemote').DataTable(App.mergeProps(this.tableSettings, {rowId: 'image'}));
        this.setRemoteTableEvents();
    },
    initRemotePaesslerTable: function(){
        this.tablePaesslerRemote =$('#tablePaesslerImagesRemote').DataTable(App.mergeProps(this.tableSettings, {rowId: 'image'}));
        this.setPaesslerRemoteTableEvents();
    },
    setRemoteTableEvents: function(){
        this.tableRemote.on('select', $.proxy(this.onItemSelectChange, this));
        this.tableRemote.on('deselect', $.proxy(this.onItemSelectChange, this));
    },
    setPaesslerRemoteTableEvents: function(){
        this.tablePaesslerRemote.on('select', $.proxy(this.onItemSelectChange, this));
        this.tablePaesslerRemote.on('deselect', $.proxy(this.onItemSelectChange, this));
    },
    initNightlyTable: function(){
        this.tableNightly =$('#tableImagesNightly').DataTable(App.mergeProps(this.tableSettings, {rowId: 'fingerprint'}));
        this.setNightlyTableEvents();
    },
    setNightlyTableEvents: function(){
        this.tableNightly.on('select', $.proxy(this.onItemSelectChange, this));
        this.tableNightly.on('deselect', $.proxy(this.onItemSelectChange, this));
    },
    filterRemoteTable: function(e) {
        this.tableRemote.search(e.target.value).draw();
    },
    filterPaesslerRemoteTable: function(e) {
        this.tablePaesslerRemote.search(e.target.value).draw();
    },
    filterNightlyTable: function(e) {
        this.tableNightly.search(e.target.value).draw();
    },
    onItemSelectChange : function(e, dt, type, indexes ){
        if(this.activeTab=='local'){
            var state = this.tableLocal.rows({selected:true}).count()>0;
            var visibility= !state?'attr':'removeAttr';
            $('#buttonLaunchContainers')[visibility]('disabled', 'disabled');
            $('#buttonDelete')[visibility]('disabled', 'disabled');
            $('#selectAllLocal').prop('checked',this.tableLocal.rows({selected:true}).count()==this.tableLocal.rows().count());
            return;
        }
        if(this.activeTab=='remote'){
            var state = this.tableRemote.rows({selected:true}).count()>0
            var visibility= !state?'attr':'removeAttr';
            $('#buttonDownload')[visibility]('disabled', 'disabled');
            $('#selectAllRemote').prop('checked',this.tableRemote.rows({selected:true}).count()==this.tableRemote.rows().count());
            return;
        }
        if(this.activeTab=='remotePaessler'){
            var state = this.tablePaesslerRemote.rows({selected:true}).count()>0
            var visibility= !state?'attr':'removeAttr';
            $('#buttonDownloadPaessler')[visibility]('disabled', 'disabled');
            $('#selectAllRemotePaessler').prop('checked',this.tablePaesslerRemote.rows({selected:true}).count()==this.tablePaesslerRemote.rows().count());
            return;
        }
        if(this.activeTab=='nightly'){
            var state = this.tableNightly.rows({selected:true}).count()>0
            var visibility= !state?'attr':'removeAttr';
            $('#buttonDownloadNightly')[visibility]('disabled', 'disabled');
            $('#selectAllNightly').prop('checked',this.tableNightly.rows({selected:true}).count()==this.tableNightly.rows().count());
            return;
        }
    },
    doDeleteLocalImages: function(){
        this.tableLocal.rows( { selected: true } ).data().map(function(row){
            $.ajax({
                url: App.baseAPI+'image/' + row['fingerprint'],
                type: 'DELETE',
                success: $.proxy(this.onDeleteSuccess, this, row['fingerprint'])
            });
        }.bind(this));
    },
    onDeleteSuccess: function(fingerprint){
        this.tableLocal.row("#"+fingerprint).remove().draw();
         $('#buttonLaunchContainers').hide();
         $('#buttonDelete').hide();
         var counter = parseInt($('#btnLocalImages > span').text());
         $('#btnLocalImages > span').text(counter-1);
    },
    doDownload: function(){
        activeTab = this.activeTab;
        $('#modalDownloadButton').attr('disabled', 'disabled');
        if(activeTab=='nightly') {
            this.tableNightly.rows({selected: true}).data().map(function(row){
                $.ajax({
                    url:App.baseAPI+'image/remote',
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        image:row['fingerprint']
                    }),
                    success: $.proxy(this.onDownloadSuccess, this, row['image'])
                });
                this.tableRemote.row('#'+row['image']).remove().draw(false);
            }.bind(this));
        } else if(activeTab=='remote') {
            this.tableRemote.rows({selected: true}).data().map(function(row){
                $.ajax({
                    url:App.baseAPI+'image/remote',
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        image:row['image']
                    }),
                    success: $.proxy(this.onDownloadSuccess, this, row['image'])
                });
                this.tableRemote.row('#'+row['image']).remove().draw(false);
            }.bind(this));
        } else if(activeTab=='remotePaessler') {
            this.tablePaesslerRemote.rows({selected: true}).data().map(function(row){
                $.ajax({
                    url:App.baseAPI+'image/remotePaessler',
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        image:row['image']
                    }),
                    success: $.proxy(this.onDownloadSuccess, this, row['image'])
                });
                this.tablePaesslerRemote.row('#'+row['image']).remove().draw(false);
            }.bind(this));
        }
    },
    onDownloadSuccess: function(imageName, response){
         location.reload();
    },
    getData: function(){
        //this.setLoading(true);
        if(this.activeTab=='local')
            location.reload();
            //return $.get(App.baseAPI+'image', $.proxy(this.getDataSuccess, this));
        if(this.activeTab=='remote')
            return $.get(App.baseAPI+'image/remote', $.proxy(this.getDataSuccess, this));
        if(this.activeTab=='remotePaessler')
            return $.get(App.baseAPI+'image/remotePaessler', $.proxy(this.getDataSuccess, this));
    },
    getDataJSON: function(){
        //this.setLoading(true);
        if(this.activeTab=='local')
            return $.get(App.baseAPI+'image', $.proxy(this.getDataSuccess, this));
        if(this.activeTab=='remote')
            return $.get(App.baseAPI+'image/remote', $.proxy(this.getDataSuccess, this));
        if(this.activeTab=='remotePaessler')
            return $.get(App.baseAPI+'image/remotePaessler', $.proxy(this.getDataSuccess, this));
       if(this.activeTab=='nightly')
            return $.get(App.baseAPI+'image/remote/nightly/list', $.proxy(this.getDataSuccess, this));
    },
    activateScreen: function(screen){
        this.tableLocal.rows({selected:true}).deselect();
        this.tableRemote.rows({selected:true}).deselect();
        this.tablePaesslerRemote.rows({selected:true}).deselect();
        $('.mg-bottom15').show();
        if(screen==='local'){
            $('#tableImagesLocalWrapper').show();
            $('#tableImagesRemoteWrapper').hide();
            $('#tablePaesslerImagesRemoteWrapper').hide();
            $('#buttonDelete').show();
            $('#buttonLaunchContainers').show();
            $('.local-tab-action-buttons').show();
            $('#buttonJSONRaw').show();
            $('#buttonDownload').hide();
            this.activeTab = 'local';
            return;
        }
        if(screen==='remote'){
            $('#tableImagesLocalWrapper').hide();
            $('#tableImagesRemoteWrapper').show();
            $('#tablePaesslerImagesRemoteWrapper').hide();
            $('#buttonLaunchContainers').hide();
            $('#buttonJSONRaw').hide();
            $('#buttonDownload').show();
            $('#buttonDelete').hide();
            this.activeTab = 'remote';
            return;
        }
        if(screen==='remotePaessler'){
             $('#tableImagesLocalWrapper').hide();
            $('#tableImagesRemoteWrapper').hide();
            $('#tablePaesslerImagesRemoteWrapper').show();
            $('#buttonLaunchContainers').hide();
            $('#buttonJSONRaw').hide();
            $('#buttonDownload').show();
            $('#buttonDelete').hide();
            this.activeTab = 'remotePaessler';
            return;
        }
        if(screen=='nightly') {
            this.activeTab = 'nightly';
            return;
        }
    },
    updateLocalTable: function(jsonData){
        this.data = jsonData;
        this.tableLocal.clear();
        this.tableLocal.destroy();
        this.tableLocal = $('#tableImagesLocal').DataTable(App.mergeProps(this.tableSettings, {
            rowId:'fingerprint',
            data : this.data,
            columns : [
                { title:'Select', data: null, defaultContent:''},
                { title:'OS', data : 'properties.os'},
                { title:'Description', data : 'properties.description' },
                { title:'Aliases', data : 'aliases'},
                { title:'Release', data : 'properties.release' },
                { title:'Architecture', data : 'properties.architecture' },
                { title:'Size', data : 'size',
                    render:function(field){
                        return App.formatBytes(field);
                    }
                }
            ]
        }));
    },
    updateRemoteTable: function(jsonData){
        this.remoteData = jsonData;
        this.tableRemote.clear();
        this.tableRemote.destroy();
        this.tableRemote=$('#tableImagesRemote').DataTable(App.mergeProps(this.tableSettings, {
            rowId:'image',
            data : this.remoteData,
            columns : [
                { title:'Select', data: null, defaultContent:''},
                { title: 'Distribution', data : 'distribution' },
                { title: 'Architecture', data : 'architecture' },
                { title: 'Image', data : 'image' },
                { title: 'Name', data : 'name' }
            ]
        }));
    },
    updateRemotePaesslerTable: function(jsonData){
        this.remotePaesslerData = jsonData;
        this.tablePaesslerRemote.clear();
        this.tablePaesslerRemote.destroy();
        this.tablePaesslerRemote=$('#tablePaesslerImagesRemote').DataTable(App.mergeProps(this.tableSettings, {
            rowId:'image',
            data : this.remotePaesslerData,
            columns : [
                { title:'Select', data: null, defaultContent:''},
                { title: 'Distribution', data : 'distribution' },
                { title: 'Architecture', data : 'architecture' },
                { title: 'Image', data : 'image' },
                { title: 'Name', data : 'name' }
            ]
        }));
    },
    getDataSuccess: function(response){
        this.setLoading(false);
        this.rawJson.setValue(JSON.stringify(response.data, null , '\t'));
//        if(this.activeTab=='local'){
//            this.updateLocalTable(response.data);
//        }
//        if(this.activeTab == 'remote'){
//            this.updateRemoteTable(response.data);
//        }
    },
    showJSON: function(e) {
        this.rawJson.setValue('');
        $('.modal-title').text('');
        $('.modal-title').text('RAW JSON for Images');
        $('.modal-title').append(' <span class="glyphicon glyphicon-refresh spinning loader">');
        $("#jsonModal").modal("show");

        this.getDataJSON();

    },
    getRemoteData: function(){
        $.get(App.baseAPI+'image/remote', $.proxy(this.getDataSuccess, this));
    },
    getPaesslerRemoteData: function(){
        $.get(App.baseAPI+'image/remotePaessler', $.proxy(this.getDataSuccess, this));
    },
    generateContainerFormSection: function(image, pos){
        var tempSection = this.containerTemplate.clone();
        tempSection.prop('id',image.fingerprint);
        tempSection.find('input[name="name"]').prop('name', 'containers['+pos+'][name]');
        //Handle exported containers
        if (image.properties.os !== undefined)
            tempSection.find('input[name="containers['+pos+'][name]"]').val(App.properties.left[Math.floor((Math.random() * 93) + 1)] + '-' + App.properties.right[Math.floor((Math.random() * 160) + 1)] + '-');
        else
            tempSection.find('input[name="containers['+pos+'][name]"]').val(App.properties.left[Math.floor((Math.random() * 93) + 1)] + '-' + App.properties.right[Math.floor((Math.random() * 160) + 1)] + '-');

        tempSection.find('input[name="image"]').prop('name', 'containers['+pos+'][image]');
        tempSection.find('input[name="containers['+pos+'][image]"]').val(image.fingerprint);

        tempSection.find('input[name="count"]').prop('name', 'containers['+pos+'][count]');
        tempSection.find('input[name="containers['+pos+'][count]"]').on('change', $.proxy(this.onCountChange, this, $(tempSection.find('.nodeCount'))));

        tempSection.find('input[name="cpu[percentage]"]').prop('name', 'containers['+pos+'][cpu[percentage]]');
        tempSection.find('#cpu_percentage').prop('id', 'cpu_percentage_'+pos);
        tempSection.find('#cpu_percentage_'+pos).on('change',$.proxy(this.updateFieldValue, this,tempSection.find('input[name="containers['+pos+'][cpu[percentage]]"]')));
        tempSection.find('input[name="containers['+pos+'][cpu[percentage]]"]').on('change',$.proxy(this.updateFieldValue, this,tempSection.find('#cpu_percentage_'+pos)));

        tempSection.find('input[name="cpu[hardLimitation]"]').prop('name', 'containers['+pos+'][cpu[hardLimitation]]');

        tempSection.find('input[name="memory[sizeInMB]"]').prop('name', 'containers['+pos+'][memory[sizeInMB]]');
        tempSection.find('#memory_percentage').prop('id', 'memory_percentage_'+pos);
        tempSection.find('#memory_percentage_'+pos).on('change',$.proxy(this.updateFieldValue, this,tempSection.find('input[name="containers['+pos+'][memory[sizeInMB]]"]')));
        tempSection.find('input[name="containers['+pos+'][memory[sizeInMB]]"]').on('change',$.proxy(this.updateFieldValue, this,tempSection.find('#memory_percentage_'+pos)));
        tempSection.find('input[name="memory[hardLimitation]"]').prop('name', 'containers['+pos+'][memory[hardLimitation]]');

        tempSection.find('input[name="autostart"]').prop('name', 'containers['+pos+'][autostart]');
        tempSection.find('input[name="stateful"]').prop('name', 'containers['+pos+'][stateful]');

        tempSection.find('select[name="profiles"]').prop('name', 'containers['+pos+'][profiles]');
        tempSection.find('select[name="containers['+pos+'][profiles]"]').addClass('selectpicker');
        tempSection.find('select[name="containers['+pos+'][profiles]"]').prop('id', image.fingerprint+'_profiles');

        tempSection.find('.imageName').text(image.properties.description);

        tempSection.find('#accordion').prop('id', 'accordion_'+pos);
        tempSection.find('#accordion_link').prop('id', 'accordion_link_'+pos);
        tempSection.find('#accordion_link_'+pos).prop('data-parent', '#accordion_'+pos);
        tempSection.find('#accordion_link_'+pos).prop('href', '#collapse_'+pos);

        tempSection.find('#advancedSettingsMultipleContainer').prop('id', 'advancedSettingsMultipleContainer_'+image.fingerprint);

        tempSection.find('#collapse').prop('id', 'collapse_'+pos);

        tempSection.show();
        return tempSection;
    },
    onCountChange: function(countNode, event){
        $(countNode).text($(event.target).val() +' Nodes');
    },
    getImageByFingerPrint: function(tempList, fingerprint){
        return tempList.filter(function(image){
            return image.fingerprint === fingerprint;
        })[0];
    },
    launchContainers: function(){
        var count = 0;
        this.tableLocal.rows({selected: true}).data().map(function(row){
            var tempForm = this.generateContainerFormSection(
                this.getImageByFingerPrint(this.data, row['fingerprint'])
            , count);
            $('#multiContainerSection').append(tempForm);
            count+=1;
        }.bind(this));
        //initialize profile pickers
        $('.selectpicker').selectpicker();
        this.switchView('form');
        $('.image-tabs').addClass('hidden');
    },
    switchView: function(view){
        $('#createMultipleContainersForm')[view=='form'?'show':'hide']();
        $('#tableImagesLocalWrapper')[view=='localList'?'show':'hide']();
        $('#tableImagesRemoteWrapper')[view=='remoteList'?'show':'hide']();
        $('#tablePaesslerImagesRemoteWrapper')[view=='remotePaesslerList'?'show':'hide']();
        if(view!=='form'){
            $('.image-tabs').removeClass('hidden');
            $('#multiContainerSection').empty();
        }else{
            $('.mg-bottom15').hide();
        }
        if(view=='remoteList'){
            return this.activateScreen('remote');
        }
        if(view=='remotePaesslerList'){
            return this.activateScreen('remotePaessler');
        }
        if(view=='localList'){
            return this.activateScreen('local');
        }
        if(view=='nightlyList'){
            return this.activateScreen('nightly');
        }
        $('#buttonLaunchContainers').hide();
        $('#buttonDelete').hide();
        $('#rawJSONImages').hide();
        $('.local-tab-action-buttons').hide();

        $('#containerNameImages').val(App.properties.left[Math.floor((Math.random() * 93) + 1)] + '-' + App.properties.right[Math.floor((Math.random() * 160) + 1)] + '-');
    },
    generateContainer: function(name, formData){
        return {
            ...formData,
            name:name
        }
    },
    generateImageContainers: function(formData){
        var imageContainers = [];
        var tempData = this.cleanupFormData($.extend({}, true,formData));
        for(var i=0;i<=Number(formData.count)-1;i++){
            if (tempData.name == '') {
                imageContainers.push(this.generateContainer(App.properties.left[Math.floor((Math.random() * 93) + 1)] + '-' + App.properties.right[Math.floor((Math.random() * 160) + 1)], tempData));
            }
            else {
                imageContainers.push(this.generateContainer(tempData.name+(i+1),tempData));
            }
        }
        return imageContainers;
    },
    cleanupFormData(specs){
        delete specs['count'];
        specs['cpu']['percentage']=Number(specs['cpu']['percentage']);
        specs['cpu']['hardLimitation']=Boolean(specs['cpu']['hardLimitation']) || false;
        specs['memory']['sizeInMB']=Number(specs['memory']['sizeInMB']);
        specs['memory']['hardLimitation']=Boolean(specs['memory']['hardLimitation']) || false;
        specs['stateful']=Boolean(specs['stateful']);
        specs['autostart']=Boolean(specs['autostart']);
        if($('#'+specs.image+'_profiles').val()){
            specs['profiles'] = $('#'+specs.image+'_profiles').val();
        }

        specs['config'] = this.readKeyValuePairs('#advancedSettingsMultipleContainer_'+specs.image);
        return specs;
    },
    generateRequest: function(inputJSON){
        var tempRequest = [];
        var containerArray = $.map(inputJSON.containers, function(val, ind){ return [val]; });
        for(var i=containerArray.length-1, container; container=containerArray[i];i--){
            var tempData = this.generateImageContainers(container);
            tempRequest=tempRequest.concat(tempData);
        }
        return tempRequest;
    },
    doCreateContainer: function(e){
        e.preventDefault();
        var tempForm = $.extend({}, true,this.newContainerForm.serializeJSON());
        var tempJSON = this.generateRequest(tempForm);

        $.ajax({
            url: App.baseAPI +'container/',
            type:'POST',
            dataType:'json',
            contentType: 'application/json',
            data: JSON.stringify(tempJSON),
            success: $.proxy(this.onCreateSuccess, this),
            error: $.proxy(this.onCreateFailed, this)
        });
    },
    onCreateSuccess: function(response){
        this.switchView('localList');
        window.location = App.baseWEB +'containers';
    },
    readKeyValuePairs: function(selector) {
        keyValues = {}
        $(selector).find('input:enabled').each(function() {
            keyValues[this.name] = this.value;
        })

        return keyValues;
    },
    launchContainer:function(fingerprint){
        this.tableLocal.row('#'+fingerprint).select();
        this.launchContainers();
    },
    toggleSelectAll:function(name, event){
        if(event.target.checked){
            this['table'+name].rows().select();
        }else{
            this['table'+name].rows().deselect();
        }
    },
    updateFieldValue: function(target, event){
        target.val(event.target.value);
    },
    showRemoteDetails: function(image){
        this.tableRemote.rows().deselect();
        this.tableRemote.rows('#'+image).select();
        $.get(App.baseAPI+'image/remote/details?alias='+image, $.proxy(this.onGetRemoteDetailsSuccess, this));
    },
    showRemotePaesslerDetails: function(image){
        this.tablePaesslerRemote.rows().deselect();
        this.tablePaesslerRemote.rows('#'+image).select();
        $.get(App.baseAPI+'image/remotePaessler/details?alias='+image, $.proxy(this.onGetRemoteDetailsSuccess, this));
    },
    showNightlyDetails: function(image, fingerprint) {
        this.tableNightly.rows().deselect();
        this.tableNightly.rows('#'+fingerprint).select();
        $.get(App.baseAPI+'image/remote/details?alias='+image, $.proxy(this.onGetRemoteDetailsSuccess, this));
    },
    onGetRemoteDetailsSuccess: function(response){
        this.generateModalDetails(response);
    },
    generateItem:function(key, value){
        return '<div class="form-group"><label class="control-label col-sm-3">'+key+'</label><p class="col-sm-9" title="'+value+'">'+value+'</p></div>';
    },
    generateModalDetails: function(response) {
      var tempData = response.data;
      var modalBody = $('#modalBody');
      modalBody.empty();

      $('.imageName').text(tempData.properties.name);
      // Architecture
      modalBody.append(this.generateItem('Os', tempData.properties.os));
      modalBody.append(this.generateItem('Distribution', tempData.properties.distribution));
      modalBody.append(this.generateItem('Release', tempData.properties.release));
      modalBody.append(this.generateItem('Architecture', (tempData.architecture + '(' + tempData.properties.architecture + ')')));
      modalBody.append(this.generateItem('Size', App.formatBytes(tempData.size)));

      modalBody.append('<div class="form-group col-lg-12"><hr style="border:1px solid lightgrey;"/></div>');

      modalBody.append(this.generateItem('Fingerprint', tempData.fingerprint));
      modalBody.append(this.generateItem('Filename', (tempData.filename + '(' + tempData.properties.filename + ')')));
      modalBody.append(this.generateItem('Created at', tempData.created_at));
      modalBody.append(this.generateItem('Uploaded at', tempData.uploaded_at));
      modalBody.append(this.generateItem('Expires at', tempData.expires_at));
      modalBody.append(this.generateItem('Aliases', tempData.properties.build));
      modalBody.append(this.generateItem('Build', tempData.properties.build));
      modalBody.append(this.generateItem('Description', tempData.properties.description));
      modalBody.append(this.generateItem('Build', tempData.properties.build));
      modalBody.append(this.generateItem('Serial', tempData.properties.serial));
      modalBody.append(this.generateItem('Public', tempData.public));

      modalBody.append('<div class="form-group col-lg-12"><hr style="border:1px solid lightgrey;"/></div>');
      modalBody.append('<div class="form-group"><a data-toggle="collapse" class="collapse-acc" data-parent="#aliases" href="#aliasesList">Aliases</a></div>');
      modalBody.append('<div id="aliasesList" class="form-group panel-collapse collapse"></div>');

      var aliasesList = $('#aliasesList');
      tempData.aliases.forEach(function(alias, index){
            aliasesList.append('<div id="aliases" class="form-group"><b>Alias '+(index+1)+'</b></div>')
           aliasesList.append(this.generateItem('Description',alias.description));
           aliasesList.append(this.generateItem('Name',alias.name));
           aliasesList.append(this.generateItem('Target',alias.target));
      }.bind(this));
      modalBody.append(aliasesList);
      $('#myModal').modal().show();

    }
}