/**
 * Created by Clément on 28/10/2015.
 */

var contactList=[];
var groupList=[];
currentContact=new Contact();
var db=new Database();
var removed=[];
var latlng=null;
var strtosave=null;
var saved=true;
var delay = 300;
var clicks = 0;
var timer = null;
$(document).ready(function() {
    initDb();
    initPage(); //Load contact/group from db and display
    $('#addCont').click(function(e){addContact();}); //Event to add contact
    $('#alphabet td').click(function(e){sortByLetter(e);});//Event to display specified contacts
    $('#createSave button').click(function(e) {checkEntry();});//Event to create the new contact
    $('#center').css({
        overflow:'auto',
        height:$(document).height()*0.95+'px',
        width:$(document).width()*0.39+'px'
    });
    $('#contactPreview .location').click(function(event) {showLocation(event);});//Event to show the location of a contact
    $('#right,#right>div').css({
        height:$(document).height()*0.95+'px',
        width:$(document).width()*0.39+'px'
    });
    $('#contactList').click(function(e) {centerClick(e);});//Event to handle a click on the center view
    $('.createAdd').click(function (e) {addWhenCreate(e);});//Event to add phone number/email address/address during the creation of a contact
    $('.add button').click(function(event) {modify(event);});//Event to add information on existing contact
    $('#choosePhoto').change(function(e) {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $src= e.target.result;
                if($('#contactPreview').is(':visible')) { //if modify photo
                    $contactId=$('#contactPreview table').attr('contid');
                    $('#contactPhoto').attr('src',$src);
                    $('.fancybox').attr('href',$src);
                    $('#'+$contactId+' td:first-child img').attr('src',$src);
                    for (var i in contactList) {
                        if(contactList[i].id==$contactId) {
                            contactList[i].photo=$src;
                            break;
                        }
                    }
                }
                else if($('#createContact').is(':visible') ) $('#createPhoto img').attr('src',$src);
            };
            reader.readAsDataURL(this.files[0]);
        }
    }); //Event to add a photo
    $('.fancybox').fancybox({
        openEffect:'elastic',
        closeEffect:'elastic'
    });
    $('#createPhoto').click(function() {$('#choosePhoto').click();}); //Event to chose a photo
    $('#contactPhoto').on('click',function(event) {
        clicks++;
        if(clicks === 1) {
            timer = setTimeout(function() {
                $('.fancybox').click();
                clicks = 0;
            }, delay);
        }
        else {
            clearTimeout(timer);
            modify(event);
            clicks = 0;
        }
    })
        .on('dblclick', function(event){event.preventDefault();}); //Event to enlarge or modify a contact's photo
    $('#fb').on('click',function(event) {
        $contact=null;
        for (var i in contactList) {
            if(contactList[i].id==$('#contactPreview table').attr('contid')) $contact=contactList[i];
        }
        clicks++;
        if(clicks === 1) {
            timer = setTimeout(function() {
                if(!$('#fb .save').is(':visible') && !$(event.target).is('.save')){
                    if($contact.fb!='') window.open($contact.fb);
                    else toastr.info('This contact has no Facebook profile','Info');
                }
                clicks = 0;
            }, delay);
        }
        else {
            clearTimeout(timer);
            modify(event);
            clicks = 0;
        }
    })
        .on('dblclick',function(event){event.preventDefault();});//Event to show Fb page or modify contact's fb
    $('#skype').on('click',function(event) {
        $contact=null;
        for (var i in contactList) {
            if(contactList[i].id==$('#contactPreview table').attr('contid')) $contact=contactList[i];
        }
        clicks++;
        if(clicks === 1) { //On single click
            timer = setTimeout(function() {
                if(!$('#skype .save').is(':visible') && !$(event.target).is('.save')) {
                    if($contact.skype!='') showSocial($contact.skype);
                    else toastr.info('This contact has no Skype profile','Info');
                }
                clicks = 0;
            }, delay);
        }
        else {
            clearTimeout(timer);
            modify(event);
            clicks = 0;
        }
    })
        .on('dblclick',function(event){event.preventDefault();});//Event to call/chat via skype or modify contact's skype
   $(window).on('beforeunload',function() {
        if(saved) return 'You can proceed.';
        else return saveContacts();
    });//Event when the user close/reload the
    $('#maritalStat').dblclick(function(event) {modify(event);});//Event to modify the marital status of a contact
    $("input[id='search']").on('change paste keyup',function() {
        search($('#search').val());
    });//Event to search a contact
    $('.direction').click(function() {
       showDirection();
    });//Event to show the direction to a contact
    $('.drop').droppable({
        over:function(event,ui) { //When drag is on drop
            if($(event.target).attr('id')=='trash') {
                $(event.target.children).attr('src','Images/trashondrag.png');
                $('body').css('cursor','pointer');
            } //Delete contact
            else if($(event.target).is('textarea')) { //Add to mail content
                $(event.target).css({border:'5px dashed #0174DF'});
                $('body').css('cursor','copy');
                $(event.target).attr('rows','12');
                $(event.target).attr('cols','46');
                $(event.target).css('font-size','18px');
                $(event.target).css('color','#0174DF');
                $(event.target).css('text-align','center');
                strtosave=$(event.target).val();
                $(event.target).val('Drop Contact here\nto add a small description.');
            }
            else if ($(event.target).is('td') && $(event.target.children).is('div'))  $('body').css('cursor','copy');
        },
        out:function(event,ui) { //When drag exit drop
            $('body').css('cursor','no-drop');
            if($(event.target).attr('id')=='trash') $(event.target.children).attr('src','Images/trash.png');//Delete contact
            else if($(event.target).is('textarea')) {
                $(event.target).attr('rows','15');
                $(event.target).attr('cols','60');
                $(event.target).removeAttr('style');
                $(event.target).val(strtosave);
                strtosave=null;
            }
        },
        drop: function(event,ui) { //when drag is drop
            $('body').css('cursor','default');
            if($(event.target).attr('id')=='trash') {
                $('#trash img').attr('src','Images/trash.png');
                removeContact(ui.draggable); //Delete contact
            }
            else if($(event.target).is('td') && $(event.target.children).is('div')) { //Add contact to mail
                $idInput = $(event.target.children).attr('id');
                $idContact = $(ui.draggable).parent().attr('id');
                $mail = null;
                for (var i in contactList) {
                    if ($idContact == contactList[i].id) {
                        $mail = contactList[i].mailList;
                        break;
                    }
                }
                $mailNames = [];
                $value = null;
                for (var i in $mail) {
                    $mailNames.push({name: i, value: $mail[i]});
                }
                if ($mailNames.length == 1) {
                    $value = $mailNames[0].value;
                    $idInput='final'+$idInput.charAt(0).toUpperCase()+$idInput.substring(1,$idInput.length);
                    addToInput($idInput,$value);
                }
                else {
                    $mess = "<div id='dialog'>";
                    $first = true;
                    for (var i in $mailNames) {
                        if ($first) $mess += "<input type='checkbox' value='" + $mailNames[i].value +"' checked='checked'/>  " + $mailNames[i].name + " : " + $mailNames[i].value + "<br/>";
                        else $mess += "<input type='checkbox' value='" + $mailNames[i].value +"'/>  " + $mailNames[i].name + " : " + $mailNames[i].value + "<br/>";
                        $first = false
                    }
                    $mess += '</div>';
                    bootbox.dialog({
                        title: 'Choose an email address',
                        message: $mess,
                        buttons: {
                            success: {
                                className: 'btn-success',
                                label: 'OK',
                                callback: function () {
                                    $('#dialog input:checked').each(function () {
                                        if ($value == null) $value = '';
                                        else $value += ',';
                                        $value += $(this).val();
                                    });
                                    $idInput='final'+$idInput.charAt(0).toUpperCase()+$idInput.substring(1,$idInput.length);
                                    addToInput($idInput,$value);
                                }
                            },
                            danger: {
                                label: 'Cancel',
                                className: 'btn-danger',
                                callback: function () {
                                    return;
                                }
                            }
                        }
                    });
                }
            }
            else if($(event.target).is('textarea')) {// Add small description to mail content
                $(event.target).attr('rows','15');
                $(event.target).attr('cols','60');
                $(event.target).removeAttr('style');
                $idContact = $(ui.draggable).parent().attr('id');
                $contact=null;
                $mail=[];
                $addr=[];
                $phone=[];
                $mailNameValue=null;
                $addrNameValue=null;
                $phoneNameValue=null;
                $mess="<div id='dialog'>";
                for (var i in contactList) {
                    if(contactList[i].id==$idContact) {
                        $contact=contactList[i];
                        break;
                    }
                }
                for (var i in $contact.phone) {
                    $phone.push({name:i,value:$contact.phone[i]});
                }
                for (var i in $contact.mailList) {
                    $mail.push({name:i,value:$contact.mailList[i]});
                }
                for (var i in $contact.address) {
                    $addr.push({name:i,value:$contact.address[i]});
                }


                if($phone.length==1) $phoneNameValue=$phone[0].name;
                else {
                    $first=true;
                    for (var i in $phone) {
                        if($first) $mess+="<input type='radio' name='phone' value='"+$phone[i].name+"' checked='checked'/>"+$phone[i].name+": "+$phone[i].value+"<br/>";
                        else $mess+="<input type='radio' name='phone' value='"+$phone[i].name+"'/>"+$phone[i].name+": "+$phone[i].value+"<br/>";
                        $first=false
                    }
                }
                if($mail.length==1) $mailNameValue=$mail[0].name;
                else {
                    $mess+=$phoneNameValue==null?'':'<hr>';
                    $first=true;
                    for (var i in $mail) {
                        if($first) $mess+="<input type='radio' name='mail' value='"+$mail[i].name+"' checked='checked'/>"+$mail[i].name+": "+$mail[i].value+"<br/>";
                        else $mess+="<input type='radio' name='mail' value='"+$mail[i].name+"'/>"+$mail[i].name+": "+$mail[i].value+"<br/>";
                        $first = false
                    }
                }
                if($addr.length==1) $addrNameValue=$addr[0].name;
                else {
                    $mess+=$mailNameValue==null&&$phoneNameValue==null?'':'<hr>';
                    $first=true;
                    for (var i in $addr) {
                        $value=$addr[i].value['street']+"<br/>"+$addr[i].value['postcode']+" "+$addr[i].value['city']+"<br/>";
                        if ($first) $mess += "<input type='radio' name='addr' value='" + $addr[i].name+ "' checked='checked'/>  "+$addr[i].name+": "+$value;
                        else $mess += "<input type='radio' name='addr' value='" + $addr[i].name+ "'/>  "+$addr[i].name+": "+$value;
                        $first = false
                    }
                }
                $mess+='<div>';
                if($phoneNameValue==null&&$mailNameValue==null&&$addrNameValue==null) {
                    bootbox.dialog ({
                        title: 'Choose the details',
                        message: $mess,
                        buttons: {
                            success: {
                                className: 'btn-success',
                                label: 'OK',
                                callback: function() {
                                    $phoneNameValue=$phoneNameValue==null?$('#dialog input[name=phone]:checked').val():$phoneNameValue;
                                    $mailNameValue=$mailNameValue==null?$('#dialog input[name=mail]:checked').val():$mailNameValue;
                                    $addrNameValue=$addrNameValue==null?$('#dialog input[name=phone]:checked').val():$addrNameValue;
                                    if($phoneNameValue==null&&$mailNameValue==null&&$addrNameValue==null) return;
                                    $val=$(event.target).val(strtosave+'\n----------------------------\n'+$contact.getShortDesc($phoneNameValue,$addrNameValue,$mailNameValue)+'\n----------------------------\n');
                                }
                            },
                            danger : {
                                label: 'Cancel',
                                className: 'btn-danger',
                                callback: function() {return;}
                            }
                        }
                    });
                }
                if($phoneNameValue==null&&$mailNameValue==null&&$addrNameValue==null) return;
                $val=$(event.target).val(strtosave+'\n----------------------------\n'+$contact.getShortDesc($phoneNameValue,$addrNameValue,$mailNameValue)+'\n----------------------------\n');

            }
        }
    });//Function to add droppable
    $('div.popinbg').on('click',function() {
        $('div.popin').fadeOut('fast');
        $('div.popinbg').fadeOut('fast');
    });//Event to hide the popin when the user clicks outside of it
    $('#cc,#to').on('click','.removeRecip',function(event) {
        $input=$(event.target).parent().parent().attr('id');
        $input='final'+$input.charAt(0).toUpperCase()+$input.substring(1,$input.length);
        $value=$(event.target).parent().text().split(' | ')[0];
        removeRecipient($input,$value);
    });//Event to remove an email address from the to or cc input
    $('.popin').on('click','.deleteDetails',function(event) {
        $contactId=$('#contactPreview table').attr('contid');
        $detailName=$(event.target).parent().find(':first-child').text().split(' : ')[0];
        for (var i in contactList) {
            if(contactList[i].id==$contactId) {
                $phone=0,$mail=0,$addr=0;
                for (var j in contactList[i].phone) {if(contactList[i].phone[j]!=null) $phone++;}
                for (var j in contactList[i].mailList) {if(contactList[i].mailList[j]!=null) $mail++;}
                for (var j in contactList[i].address) {if(contactList[i].address[j]!=null) $addr++;}
                switch ($('.details:visible').attr('detid')) {
                    case 'phone':
                        if($phone==1) {toastr.error('This contact will have no phone','Error');return;}
                        delete(contactList[i].phone[$detailName]);
                        break;
                    case 'mail':
                        if($mail==1) {toastr.error('This contact will mail no phone','Error');return;}
                        delete(contactList[i].mailList[$detailName]);
                        break;
                    case 'addAddress':
                        if($addr==1) {toastr.error('This contact will have no address','Error');return;}
                        delete(contactList[i].address[$detailName]);
                        break;
                }
                break;
            }
        }
        $('div.popinbg').click();
        $('#'+$contactId+' td:first-child').click();
        $('#'+$('.details:visible').attr('detid')).click();
    });//Event to delete a contact's address/phone/mail
});

/*
This function will treat every click on the central area
 */
function centerClick(event) {
    if ($(event.target).parent().attr('class')=='location' || $(event.target).attr('class')=='location') {
        showLocation(event);
    }
    else if ($(event.target).parent().attr('class')=='mail' || $(event.target).attr('class')=='mail') {
        mail(event);
    }
    else if($(event.target).parent().attr('class')=='fav' || $(event.target).attr('class')=='fav') {
        addRemoveFav(event);
    }
    if($(event.target).text()!='' && $(event.target).text().length!=1) showContact(event);
}

/*
This function will initialize the DB if not created
 */
function initDb() {
    db.open();
    db.createTable();
}
/*
This function will load the contact list and the group list from the database
 */
function initPage() {
    var phoneList=null,mailList=null,addrList=null;
    db.getAllContact(function(ret){
        contactList=ret;
    });
    db.getAllGroup(function(ret) {
       groupList=ret;
        if(ret['Favorites']==null) groupList['Favorites']=new Group('Favorites');
    });
    db.getPhone(function(ret) {
       phoneList=ret;
    });
    db.getMail(function(ret) {
        mailList=ret;
    });
    db.getAddress(function(ret) {
        addrList=ret;
        var currId;
        for (var i in contactList) {
            currId=contactList[i].id;
            contactList[i].phone=phoneList[currId];
            contactList[i].mailList=mailList[currId];
            contactList[i].address=addrList[currId];
        }
        createContactList(contactList);
        $('#groups').html(createGroupList());
        $listBday=[];
        for (var i in contactList) {
            if(contactList[i].isBDay()) {
                if($listBday['today']==null) $listBday['today']=[];
                $listBday['today'].push(contactList[i]);
            }
            else if(contactList[i].isBDayTomorrow()) {
                if($listBday['tomorrow']==null) $listBday['tomorrow']=[];
                $listBday['tomorrow'].push(contactList[i]);
            }
        }
        if($listBday['today']!=null || $listBday['tomorrow']!=null) wishBDay($listBday);
        updateDropGroupEvent();
    });
}

/*
This function will display the mail UI to send a mail to the specified person
 */
function mail(event){
    $contactId=$(event.target).parent().parent().attr('id')==null?$(event.target).parent().attr('id'):$(event.target).parent().parent().attr('id');
    $contact=null;
    for (var i in contactList) {
        if(contactList[i].id==$contactId) {
            $contact=contactList[i];
            break;
        }
    }
    $mailNames=[];
    $name=null;
    $value=null;
    for (var i in $contact.mailList) {
        $mailNames.push({name:i,value:$contact.mailList[i]});
    }
    if($mailNames.length==1) {
        $value=$mailNames[0].value;
        $('#createPhone td input[type=number]').css('box-shadow','none');
        $('#createMail td input[type=email]').css('box-shadow','none');
        $('#createAddress td input').css('box-shadow','none');
        $('#right>div').hide();
        $('#mailUI').show();
        $('#mailUI input').val('');
        $('#mailUI div,#mailUI input').text('');
        addToInput('finalTo',$value);
        $('#mailUI').css({height:$('#right').height()+'px'})
        $('#to, #cc').css({
            height:$('#to').parent().height()+'px',
            width:$('#to').parent().width()*0.9+'px'
        });
        $('#send').click(function() {
            $message=$('#content').val();
            $subject=$('#subject').val();
            $cc=$('#finalCc').val();
            $to=$('#finalTo').val();
            if($to=='' || $subject=='') toastr.error('You have to enter a recipient and a subject','Error');
            else {
                console.log('mailto:' + $to + '?subject=' + $subject + '&cc=' + $cc + '&body=' + $message);
                toastr.info('Your message has been send', 'Info');
            }
        });
        $('#cancelMail').click(function() {
            removeRecipient('finalTo','*');
            removeRecipient('finalCc','*');
            $('#mailUI input[type=text]').val('');
            $('#to, #cc').text('');
            $('#mailUI textarea').val('');
            $('#mailUI').hide();
        });
    }
    else {
        $mess="<div id='dialog'>";
        $first=true;
        for (var i in $mailNames) {
            if($first) $mess+="<input type='checkbox' value='"+$mailNames[i].value+"' checked='checked'/>  "+$mailNames[i].name+" : "+$mailNames[i].value+"<br/>";
            else $mess+="<input type='checkbox' value='"+$mailNames[i].value+"'/>  "+$mailNames[i].name+" : "+$mailNames[i].value+"<br/>";
            $first=false
        }
        $mess+='</div>';
        bootbox.dialog ({
            title: 'Choose an email address',
            message: $mess,
            buttons: {
                success: {
                    className: 'btn-success',
                    label: 'OK',
                    callback: function() {
                        $('#dialog input:checked').each(function() {
                           if($value==null) $value='';
                           else $value+=',';
                           $value+=$(this).val();

                        });
                        $('#createPhone td input[type=number]').css('box-shadow','none');
                        $('#createMail td input[type=email]').css('box-shadow','none');
                        $('#createAddress td input').css('box-shadow','none');
                        $('#right>div').hide();
                        $('#mailUI').show();
                        $('#mailUI input').val('');
                        $('#mailUI div,#mailUI input').text('');
                        addToInput('finalTo',$value);
                        $('#mailUI').css({height:$('#right').height()+'px'})
                        $('#to, #cc').css({
                            height:$('#to').parent().height()+'px',
                            width:$('#to').parent().width()*0.9+'px'
                        });
                        $('#send').click(function() {
                            $message=$('#content').val();
                            $subject=$('#subject').val();
                            $cc=$('#finalCc').val();
                            $to=$('#finalTo').val();
                            console.log('mailto:'+$to+'?subject='+$subject+'&cc='+$cc+'&body='+$message);
                            toastr.info('Your message has been sent','Info');
                        });
                        $('#cancelMail').click(function() {
                            removeRecipient('finalTo','*');
                            removeRecipient('finalCc','*');
                            $('#mailUI input[type=text]').val('');
                            $('#to,#cc').text('');
                            $('#mailUI textarea').val('');
                        });
                    }
                },
                danger : {
                    label: 'Cancel',
                    className: 'btn-danger',
                    callback: function() {return;}
                }
            }
        });
    }
}

/*
This function will add contact email address to the recipient or cc input
@param value : the value of the email address if more than one they will be separated by ","
@param input : the id of the input where the value is going to be
 */
function addToInput(input,value) {
    var element='';
    var splited=value.split(',');
    $quit=false;
    for (var i in splited) {
        element+=" <span class='recipient'>"+splited[i]+" |<span class='removeRecip'> X</span></span>";
        $('#to>span').each(function() {
            if($(this).text()==splited[i]+' | X') {
                $quit=true;
                toastr.warning('You already have '+splited[i]+' in your TO input.','There is no need');
                return;
            }
        });
        $('#cc>span').each(function() {
            if($(this).text()==splited[i]+' | X') {
                $quit=true;
                toastr.warning('You already have '+splited[i]+' in your CC input.','There is no need');
                return;
            }
        });
    }
    if($quit) return;
    if($('#'+input).val()=='') $('#'+input).val(value);
    else $('#'+input).val($('#'+input).val()+','+value);
    if(input=='finalTo') $('#to').append(element);
    else if(input=='finalCc') $('#cc').append(element);

}

/*
This function will remove recipient from the To input and the Cc input
@param value: the value to remove
@param input : the input from where it has to be removed
 */
function removeRecipient(input,value) {
    if(value=='*') {
        if(input=='finalTo') $('#to').html();
        else if(input=='finalCC') $('#cc').html();
        $('#'+input).val('');
    }
    else {
        if(input=='finalTo') {
            var splited=$('#finalTo').val().split(',')
            var index=splited.indexOf(value);
            splited.splice(index,1);
            $('#finalTo').val(splited.join(','));
            $('#to span').each(function() {
                if($(this).html().split(' |')[0]==value) $(this).remove();
            });
        }
        else if(input=='finalCc') {
            var splited=$('#finalCc').val().split(',')
            var index=splited.indexOf(value);
            splited.splice(index,1);
            $('#finalCc').val(splited.join(','));
            $('#cc span').each(function() {
                if($(this).html().split(' |')[0]==value) $(this).remove();
            });
        }
    }
}

/*
This function will create a Contact
 */
function addContact() {
    $('#right>div').hide();
    $('#mailUI textarea').val('');
    $('#createPhone td input[type=number]').css('box-shadow','none');
    $('#createMail td input[type=email]').css('box-shadow','none');
    $('#createAddress td input').css('box-shadow','none');
    removeRecipient('finalTo','*');
    removeRecipient('finalCc','*');
    $('#createContact').show();
}

/*
This function will create a Group
 */
function addGroup() {
    bootbox.dialog({
       title: 'Add a group',
        message:"<div id='addGroupDialog'><label>Name : </label><input type='text'/></div>",
        buttons: {
            success: {
                label:'OK',
                className:'btn-success',
                callback:function() {
                    if( $('#addGroupDialog input').val()=='') toastr.error('You have to enter a name','Error');
                    else {
                        if(groupList[$('#addGroupDialog input').val()]!=null) toastr.error('This group already exists','Error');
                        else {
                            groupList[$('#addGroupDialog input').val()]=new Group($('#addGroupDialog input').val());
                            $('#groups').html(createGroupList());
                            updateDropGroupEvent();
                            saved=false;
                        }
                    }
                }
            },
            danger: {
                label:'Cancel',
                className:'btn-danger',
                callback:function() {return;}
            }
        }
    });
}

/*
This function will display contacts in specified group
Called when the user clicks on a row of the group table
 */
function sortByGroup(event) {
    $('#right>div').hide();
    $('#mailUI textarea').val('');
    $('#createPhone td input[type=number]').css('box-shadow','none');
    $('#createMail td input[type=email]').css('box-shadow','none');
    $('#createAddress td input').css('box-shadow','none');
    removeRecipient('finalTo','*');
    removeRecipient('finalCc','*');
    $('.active').each(function() {$(this).removeClass('active');});
    $(event.target).addClass('active');
    $groupName=$(event.target).text();
    $specContactList=[];
    $specGroup=groupList[$groupName];
    for (var i in contactList) {
        if($specGroup.hasContact(contactList[i].id)) $specContactList.push(contactList[i]);
    }
    createContactList($specContactList,$groupName);
}

/*
This function will sort the contact list by specified letter
Called when user click on a cell of the alphabet table
 */
function sortByLetter(event) {
    $('#right>div').hide();
    $('#mailUI textarea').val('');
    $('#createPhone td input[type=number]').css('box-shadow','none');
    $('#createMail td input[type=email]').css('box-shadow','none');
    $('#createAddress td input').css('box-shadow','none');
    removeRecipient('finalTo','*');
    removeRecipient('finalCc','*');
    $('.active').each(function() {$(this).removeClass('active');});
    $(event.target).addClass('active');
    $letter=$(event.target).text();
    if($letter=='All') {
        createContactList(contactList);
        return;
    }
    $specContactList=[];
    for (var i in contactList) {
        if(contactList[i].name.charAt(0).toUpperCase()==$letter) $specContactList.push(contactList[i]);
    }
    createContactList($specContactList);
}

/*
This function will display all contact with their name begining by the parameter
Called when the search box is active
@param str: the value of the search
 */
function search(str) {
    str=str.toUpperCase();
    var specContactList=[];
    for (var i in contactList) {
        if(contactList[i].name.slice(0, str.length).toUpperCase() == str) specContactList.push(contactList[i]);
    }
    createContactList(specContactList);
}

/*
This function will add or remove a contact from the favorites
 */
function addRemoveFav(event) {
    $contactId=$(event.target).parent().parent().attr('id')==null?$(event.target).parent().attr('id'):$(event.target).parent().parent().attr('id');
    $group=groupList['Favorites'];
    $src=$(event.target).attr('src');
    if($src=='Images/isFav.png') {
        $(event.target).attr('src','Images/isNotFav.png');
        $group.removeContact($contactId);
    }
    else {
        $(event.target).attr('src','Images/isFav.png');
        $group.addContact($contactId);
    }
    groupList['Favorites']=$group;
    saved=false;
}

/*
This function will remove the specified contact
@param contactDrag : Dragged element
 */
function removeContact(contactDrag) {
    saved=false;
    $('#right div input').val('');
    $('#right>div').hide();
    $('#mailUI textarea').val('');
    removeRecipient('finalTo','*');
    removeRecipient('finalCc','*');
    $idContact=$(contactDrag).parent().attr('id');
    $('#'+$idContact).remove();
    $letter='';
    removed.push($idContact);
    for (var i in contactList) {
        if(contactList[i].id==$idContact) {
            $letter=contactList[i].name.charAt(0).toLowerCase();
            contactList.splice(i,1);
            break;
        }
    }
    for (var i in groupList) {
        groupList[i].removeContact($idContact);
    }

    if(contactList.length==0) {
        createContactList(contactList);
        return;
    }
    $('.letter').each(function() {
       if($(this).text().toLowerCase()==$letter) {
           if($('#contactList tr:eq('+($(this).index()+1+')')).attr('class')=='letter bg-info' || $(this).is('#contactList tr:last')) $(this).remove();
            // If the next row is a "letter" row             or      the current row is the last row in the table           we remove the row
       }
    });
}

/*
This function will save all the contacts in the DB and removed from the db those who were removed in the application
 */
function saveContacts() {
    for (var i in contactList) {
        if(!contactList[i].inDB || contactList[i].modified) db.insertContact(contactList[i]);
    }
    for (var i in removed) {
        db.removeContact(removed[i]);
    }
    db.removeGroups();
    for (var i in groupList) {
        var contacts=groupList[i].contact;
        for (var j in contacts) {
            db.affectContactGroup(contacts[j],i);
        }
    }
    saved=true;
    return 'Your contact were not saved.\nPlease stay on this page and your contact will be saved right after you close this alert box';
}


/*
This function will show the location of a contact on the map
 */
function showLocation(event) {
    $contactId=null;
    if($(event.target).parent().attr('class')=='add') $contactId=$('#contactPreview table').attr('contid');
    else $contactId=$(event.target).parent().parent().attr('id')==null?$(event.target).parent().attr('id'):$(event.target).parent().parent().attr('id');  
    $contact=null;
    $location=null;
    for (var i in contactList) {
        if(contactList[i].id==$contactId) $contact=contactList[i];
    }
    $allAddr=[];
    for (var i in $contact.address) {
        $allAddr.push(i);
    }
    if($allAddr.length==1) {
        $location=$contact.getLocation($allAddr[0]);
        $('#right>div').hide();
        $('#createPhone td input[type=number]').css('box-shadow','none');
        $('#createMail td input[type=email]').css('box-shadow','none');
        $('#createAddress td input').css('box-shadow','none');
        $('#mailUI textarea').val('');
        removeRecipient('finalTo','*');
        removeRecipient('finalCc','*');  
        $('#map').show();
        $('#map iframe').attr('src','https://www.google.com/maps/embed/v1/place?key=AIzaSyAeCuKlbDluhsnOHWIbuXJkCkka9Je-cTM&q='+$location+'&zoom=15');
        $('#map iframe').css('height',$(window).height()*0.9+'px');
    }
    else {
        $first=true;
        $mess="<div id='dialog'>";
        for (var i in $allAddr) {
            if ($first) $mess+="<input type='radio' name='location' value='"+$allAddr[i]+"' checked='checked'/>  "+$allAddr[i]+"<br/>";
            else $mess+="<input type='radio' name='location' value='"+$allAddr[i]+"' />  "+$allAddr[i]+"<br/>";
            $first=false;
        }
        $mess+='</div>';
        bootbox.dialog({
            title:'Please select an address',
            message:$mess,
            buttons: {
                success: {
                    label:'OK',
                    className:'btn-success',
                    callback:function() {
                        $name=$('#dialog input:checked').val();
                        $addr=$contact.getLocation($name);
                        $('#right>div').hide();
                        $('#createPhone td input[type=number]').css('box-shadow','none');
                        $('#createMail td input[type=email]').css('box-shadow','none');
                        $('#createAddress td input').css('box-shadow','none');
                        $('#mailUI textarea').val('');
                        removeRecipient('finalTo','*');
                        removeRecipient('finalCc','*');  
                        $('#map').show();
                        $('#map iframe').attr('src','https://www.google.com/maps/embed/v1/place?key=AIzaSyAeCuKlbDluhsnOHWIbuXJkCkka9Je-cTM&q='+$addr+'&zoom=15');
                        $('#map iframe').css('height',$(window).height()+'px');
                    }
                },
                danger: {
                    label:'Cancel',
                    className:'btn-danger',
                    callback:function(){return;}
                }
            }
        })
    }
}

/*
This function will set the current location of the user
Called in the callback parameter of the navigator.geolocation.getCurrentPostion function
@param pos : Position object return by getCurrentPosition
 */
function setLatLng(pos) {
    latlng=[];
    latlng['lat']=pos.coords.latitude;
    latlng['lng']=pos.coords.longitude;
}

/*
This function will show the direction to go to the contact address
 */
function showDirection() {
    $contactId=$('#contactPreview table').attr('contid');
    $('#contactPreview').hide();
    $contact=null;
    var location=null;
    for (var i in contactList) {
        if(contactList[i].id==$contactId) $contact=contactList[i];
    }
    $allAddr=[];
    for (var i in $contact.address) {
        $allAddr.push(i);
    }
    if($allAddr.length==1) {
        location=$contact.getLocation($allAddr[0]);
        if(navigator.geolocation) navigator.geolocation.getCurrentPosition(function(pos) {
            setLatLng(pos);
            if(latlng==null) toastr.error('Sorry, your browser doesn\'t want to share your position.','Error');
            else{
                var geocoder=new google.maps.Geocoder;
                geocoder.geocode({'location':latlng},function(rs,st) {
                    latlng=null;
                    if (st === google.maps.GeocoderStatus.OK) {
                        if (rs[1]) {
                            var origin=(rs[1].formatted_address).replace(' ','+');
                            $('#map').show();
                            $('#map iframe').attr('src','https://www.google.com/maps/embed/v1/directions?key=AIzaSyAeCuKlbDluhsnOHWIbuXJkCkka9Je-cTM&origin='+origin+'&destination='+location);
                            $('#map iframe').css('height',$(window).height()+'px');
                        }
                        else bootbox.alert('Your address could not be found.');
                    }
                    else bootbox.alert('Geocoder failed due to: ' + st);
                });
            }
        });
    }
    else {
        $mess="<div id='dialog'>";
        for (var i in $allAddr) {
            if ($first) $mess+="<input type='radio' name='direction' value='"+$allAddr[i]+"' checked='checked'/>  "+$allAddr[i]+"<br/>";
            else $mess+="<input type='radio' name='direction' value='"+$allAddr[i]+"' />  "+$allAddr[i]+"<br/>";
        }
        $mess+='</div>';
        bootbox.dialog({
            title:'Please select an address',
            message:$mess,
            buttons: {
                success: {
                    label:'OK',
                    className:'btn-success',
                    callback:function() {
                        $name=$('#dialog input:checked').val();
                        location=$contact.getLocation($name);
                        if(navigator.geolocation) navigator.geolocation.getCurrentPosition(function(pos) {
                            setLatLng(pos);
                            if(latlng==null) toastr.error('Sorry, your browser doesn\'t want to share your position.','Error');
                            else {
                                var geocoder=new google.maps.Geocoder;
                                geocoder.geocode({'location':latlng},function(rs,st) {
                                    latlng=null;
                                    if (st === google.maps.GeocoderStatus.OK) {
                                        if (rs[1]) {
                                            var origin=(rs[1].formatted_address).replace(' ','+');
                                            $('#map').show();
                                            $('#map iframe').attr('src','https://www.google.com/maps/embed/v1/directions?key=AIzaSyAeCuKlbDluhsnOHWIbuXJkCkka9Je-cTM&origin='+origin+'&destination='+location);
                                            $('#map iframe').css('height',$(window).height()+'px');
                                        }
                                        else bootbox.alert('Your address could not be found.');
                                    }
                                    else bootbox.alert('Geocoder failed due to: ' + st);
                                });
                            }
                        });
                    }
                },
                danger: {
                    label:'Cancel',
                    className:'btn-danger',
                    callback:function(){return;}
                }
            }
        })
    }
}

/*
This function will show the contact description
 */
function showContact(event) {
    $('.active').each(function() {$(this).removeClass('active');});
    $(event.target).addClass('active');
    $('#right>div').hide();
    $('#createPhone td input[type=number]').css('box-shadow','none');
    $('#createMail td input[type=email]').css('box-shadow','none');
    $('#createAddress td input').css('box-shadow','none');
    $('#mailUI textarea').val('');
    removeRecipient('finalTo','*');
    removeRecipient('finalCc','*');
    $contactId=$(event.target).parent().attr('id');
    $('#contactPreview table').attr('contid',$contactId);
    $contact=null;
    $first=true;
    $phoneTable="<table detid='phone' class='details table table-hover'>",$mailTable="<table detid='mail' class='details table table-hover'>",$addrTable="<table detid='addAddress' class='details table table-hover'>";
    for(var i in contactList) {
        if (contactList[i].id==$contactId) {
            $contact=contactList[i];
            break;
        }
    }
    $phone=$contact.phone;
    $mail=$contact.mailList;
    $addr=$contact.address;
    if($contact.photo!='') $('#contactPhoto').attr('src',$contact.photo);
    $('.fancybox').attr('href',$('#contactPhoto').attr('src'));
    $('#name').text($contact.name);
    $('#DOB').text($contact.dob.toDateString());
    $('#maritalStat').text($contact.maritalStat);
    for (var i in $phone) {
        if($phone[i]!=null) {
            if ($first) $('#phone td:first-child').text(i+' : '+$phone[i]);
            $phoneTable += "<tr><td>" + i + " : " + $phone[i] + "</td><td class='deleteDetails'>X</td></tr>";
            $first=false;
        }
    }
    $first=true;
    $phoneTable+='</table>';
    for (var i in $mail) {
        if($mail[i]!=null) {
            if ($first) $('#mail td:first-child').text(i+' : '+$mail[i]);
            $mailTable += "<tr><td>" + i + " : " + $mail[i] + "</td><td class='deleteDetails'>X</td></tr>";
            $first=false;
        }
    }
    $first=true;
    $mailTable+='</table>';
    for (var i in $addr) {
        if($addr[i]!=null) {
            if($first) {
                $('#address').text(i+' : '+$addr[i]['street']);
                $('#city').text($addr[i]['city']);
                $('#postcode').text($addr[i]['postcode']);
            }
            $addrTable+="<tr id='"+i+"'><table><tr><td>"+i+" : "+$addr[i]['street']+"</td><td class='deleteDetails'>X</td></tr>";
            $addrTable+="<tr><td>"+$addr[i]['city']+"</td><td>"+$addr[i]['postcode']+"</td></tr></table></tr>";
            $first=false;
        }
    }
    $addrTable+='</table>';
    $('#phone td:first-child').click(function(event){displayDetails(event,$phoneTable)});//Event to display every phone number of the contact
    $('#mail td:first-child').click(function(event){displayDetails(event,$mailTable)});//Event to display every email address of the contact
    $('#address').click(function(event){displayDetails(event,$addrTable)});//Event to display every address of the contact
    $('#contactPreview').show();
}

/*
This function  will modify the contact
Called when the user double click on an information
 */
function modify(event) {
    $contactId=$('#contactPreview table').attr('contid');
    $index=null,$contact=null;
    for (var i in contactList) {
        if(contactList[i].id==$contactId) {
            $contact=contactList[i];
            $index=i;
            break;
        }
    }
    if($(event.target).attr('id')==null) {
        switch($(event.target).parent().attr('id')) {
            case 'fb' :
                $('#fb').text('');
                $('#fb').html("<input type='text' placeholder='New Facebook address' ><button class='save btn btn-primary' >OK</button>");
                break;
            case 'skype' :
                $('#skype').text('');
                $('#social').hide();
                $('#skype').html("<input type='text' placeholder='New Skype pseudo'/><button class='save btn btn-primary'>OK</button>");
                break;
        }
    }
    switch($(event.target).attr('id')) {
        case 'contactPhoto' :
            $('#choosePhoto').click();
            break;
        case 'maritalStat' :
            $('#maritalStat').text('');
            $('#maritalStat').html("<input type='text' placeholder='New marital status'/><button class='save btn btn-primary' >OK</button>");
            break;
        case 'fb' :
            $('#fb').text('');
            $('#fb').html("<input type='text' placehoder='New Facebook profile address' ><button class='save btn btn-primary' >OK</button>");
            break;
        case 'skype' :
            $('#skype').text('');
            $('#social').hide();
            $('#skype').html("<input type='text' placeholder='New Skype pseudo'/><button class='save btn btn-primary' >OK</button>");
            break;
    }
    switch($(event.target).parent().parent().attr('id')) {
        case 'phone' :
            bootbox.dialog({
                title:'Please enter new values of phone number',
                message:"<label>Phone name : </label><input type='text' id='dialogPhoneName' /><br/><br/>"+
                "<label>Phone number : </label><input type='number' id='dialogPhoneNumber' /><br/>",
                buttons:{
                    success :{
                        label:'OK',
                        className:'btn-success',
                        callback:function(){
                            $name=$('#dialogPhoneName').val();
                            $phone=$contact.phone;
                            if($name=='' || $('#dialogPhoneNumber').val()=='') toastr.error('Values missing.\nPlease try again.','Error');
                            else if($phone[$name]!=null) toastr.error('Phone name already taken.\nPlease try again.','Error');
                            else {
                                $phone[$name]=$('#dialogPhoneNumber').val();
                                $contact.modified=true;
                                saved=false;
                                $contact.phone=$phone;
                                $('#'+$contactId+' td:first-child').click();
                            }
                        }
                    },
                    danger :{
                        label:'Cancel',
                        className:'btn-danger',
                        callback:function(){return;}
                    }
                }
            });
            break;
        case 'mail':
            bootbox.dialog({
                title:'Please enter new values of mail address',
                message:"<label>Mail name : </label><input type='text' id='dialogMailName' /><br/><br/>"+
                "<label>Mail address : </label><input type='email' id='dialogMailAddr' /><br/>",
                buttons:{
                    success :{
                        label:'OK',
                        className:'btn-success',
                        callback:function(){
                            $name=$('#dialogMailName').val();
                            $mail=$contact.mailList;
                            if($name=='' || $('#dialogMailAddr').val()=='') toastr.error('Values missing.\nPlease try again.','Error');
                            else if($mail[$name]!=null) toastr.error('Mail name already taken.\nPlease try again.','Error');
                            else {
                                $mail[$name] = $('#dialogMailAddr').val();
                                $contact.modified=true;
                                saved=false;
                                $contact.mailList=$mail;
                                $('#'+$contactId+' td:first-child').click();
                            }
                        }
                    },
                    danger :{
                        label:'Cancel',
                        className:'btn-danger',
                        callback:function(){return;}
                    }
                }
            });
            break;
        case 'addAddress' :
            bootbox.dialog({
                title:'Please enter new values of address',
                message:"<label>Address name : </label><input type='text' id='dialogAddrName' /> <input type='text' id='dialogStreet' placeholder='Street' /><br/><br/>"+
                    "<input type='text' id='dialogCity' placeholder='City' /> <input type='text' id='dialogPostcode' placeholder='Postcode' />",
                buttons:{
                    success :{
                        label:'OK',
                        className:'btn-success',
                        callback:function(){
                            $name=$('#dialogAddrName').val();
                            $street=$('#dialogStreet').val();
                            $city=$('#dialogCity').val();
                            $postcode=$('#dialogPostcode').val();
                            $addr=$contact.address;
                            if($name=='' || $postcode=='' || $street=='' || $city=='') toastr.error('Values missing.\nPlease try again.','Error');
                            else if($addr[$name]!=null) toastr.error('Address name already taken.\nPlease try again.','Error');
                            else {
                                $addr[$name] = {street:$street,city:$city,postcode:$postcode};
                                $contact.modified=true;
                                saved=false;
                                $contact.address=$addr;
                                $('#'+$contactId+' td:first-child').click();
                            }
                        }
                    },
                    danger :{
                        label:'Cancel',
                        className:'btn-danger',
                        callback:function(){return;}
                    }
                }
            });
            break;
    }
    $('.save').click(function(e){saveModif(e);});//Save modification made by the user
    contactList[$index]=$contact;
}

/*
This function will display the other phone number / mail address / address of the contact
@param details : DOM element to display in the popin
 */
function displayDetails(event,details) {
    $x=event.clientX;
    $y=event.clientY;
    $('div.popin').fadeIn('fast');
    $('div.popinbg').fadeIn('fast');
    $('div.popin').html(details);
    $('div.popin').css({'left':$x+'px','top':$y+'px'});
}

/*
This function will display the social interaction available with the contact selected
@param contactInfo : Skype username of the contact
 */
function showSocial(contactInfo) {
    $('#social').show();
    $('#call').show();
    $('#chat').show();
    $('#call').click(function() {
       window.location='skype:'+contactInfo+'?call';
    });
    $('#chat').click(function() {
       window.location='skype:'+contactInfo+'?chat';
    });
}

/*
This function will save the modifications the user has made on the contact
 */
function saveModif(event) {
    $modifName=$(event.target).parent().attr('id');
    $value=($('#'+$(event.target).parent().attr('id')+' input ')).val();
    if ($value=='') return;
    $contact=null,$indexInList=null;
    for (var i in contactList) {
        if(contactList[i].id==$('#contactPreview table').attr('contid')) {
            $contact=contactList[i];
            $indexInList=i;
            break;
        }
    }
    switch ($modifName) {
        case 'maritalStat' :
            $('#maritalStat').html('');
            $('#maritalStat').text($value);
            $contact.maritalStat=$value;
            break;
        case 'fb' :
            $('#fb').html("<img class='preview' src='Images/fb.png'>");
            $contact.fb=$value;
            break;
        case 'skype':
            $('#skype').html("<img class='preview' src='Images/skype.png'>");
            $('#skype').click(function(){showSocial($value);});
            $contact.skype=$value;
            break;
    }
    $contact.modified=true;
    saved=false;
    contactList[$indexInList]=$contact;
}

/*
This function will check if the user's entry to create a contact are eligible
 */
function checkEntry() {
    $phone=[],$mail=[],$addr=[];
    $name=$('#createName input').val();
    $dob=$('#createDOB input').val();
    $maritalStat=$('#createMaritalStat input').val();
    $photo=$('#createPhoto img').attr('src');
    $.extend($phone,currentContact.phone);
    $phoneName=$('#createPhone td input[type=text]').val();
    $phoneValue=$('#createPhone td input[type=number]').val();
    $phone[$phoneName]=$phone[$phoneName]==null?$phoneValue:$phone[$phoneName];
    $.extend($mail,currentContact.mailList);
    $mailName=$('#createMail td input[type=text]').val();
    $mailValue=$('#createMail td input[type=email]').val();
    $mail[$mailName]=$mail[$mailName]==null?$mailValue:$mail[$mailName];
    $.extend($addr,currentContact.address);
    $addrName=$('#createNameAddress td input').val();
    $addr[$addrName]=$addr[$addrName]==null?{'street':$('#createAddress td input').val(),'postcode':$('#createPostcode input').val(),'city':$('#createCity input').val()}:$addr[$addrName];
    $fb=$('#createFb input').val();
    $skype=$('#createSkype input').val();
    $nophone=true,$nomail=true,$noaddr=true;
    $('#createPhone td input[type=number]').css('box-shadow','0px 0px 20px 1px red');
    $('#createMail td input[type=email]').css('box-shadow','0px 0px 20px 1px red');
    $('#createAddress td input').css('box-shadow','0px 0px 20px 1px red');
    for (var i in $phone) { // If no phone number has been entered
        if($phone[i]=='') delete($phone[i]); //Remove empty value
        else {
            $nophone=false;
            $('#createPhone td input[type=number]').css('box-shadow','none');
            break;
        }
    }
    for (var i in $mail) { // If no email address has been entered
        if($mail[i]=='') delete($mail[i]); //Remove empty value
        else {
            $nomail=false;
            $('#createMail td input[type=email]').css('box-shadow','none');
            break;
        }
    }
    for (var i in $addr) { // If no address has been entered
        if($addr[i]['street']=='' && $addr[i]['postcode']=='' && $addr[i]['city']=='') delete($addr[i]); //Remove empty value
        else if($addr[i]['street']!='' && $addr[i]['postcode']!='' && $addr[i]['city']!='') {
            $noaddr=false;
            $('#createAddress td input').css('box-shadow','none');
            break;
        }
    }
    if($nophone || $noaddr || $nomail || $name=='') {toastr.error("You have to at least enter a name, a phone number, a full address and an email address.","Error !!");}
    else {
        $info=[];
        $info['name']=$name;
        $info['dob']=$dob;
        $info['maritalStat']=$maritalStat;
        $info['photo']=$photo;
        $info['phone']=$phone;
        $info['mail']=$mail;
        $info['address']=$addr;
        $info['skype']=$skype;
        $info['fb']=$fb;
        currentContact.modify($info);
        $('#createContact input').val('');
        contactList.push(currentContact);
        saved=false;
        createContactList(contactList);
        updateDragEvent();
        currentContact=new Contact();
        $('#right>div').hide();
    }
}

/*
This function will create the List of groups
 */
function createGroupList() {
    var table='<table id="groupList" class="table table-hover"><tr><th>Groups</th><td class="add"><button onclick="addGroup()" class="btn btn-primary">+</button></td></tr><tr><td class="dropGroup">Favorites</td></tr> ';
    for (var i in groupList) {
        table+=groupList[i].name!='Favorites'?'<tr><td class="dropGroup">'+groupList[i].name+'</td></tr>':'';
    }
    table+='</table>';
    return table;
}

/*
This function will create the List of Contacts
@param specContactList : Array of contact to display
@param groupName: (optionnal) the name of the group to display
 */
function createContactList(specContactList,groupName) {
    $('#contactList tr').remove();
    if(specContactList.length==0) {
        if(specContactList==contactList) {
            $('#contactList tbody').append('<tr><td>There is nothing to show.<br/><-- Add a contact</td></tr>');
            $('#addCont').css('animation','move 1.5s infinite alternate');
        }
        else {
            $('#contactList tbody').append('<tr><td>There is nothing to show.</td></tr>');
            $('#addCont').css('animation','none');
        }
        return;
    }
    $('#addCont').css('animation','none');
    for (var i in specContactList) {
        displayNewContact(specContactList[i]);
        if(groupName!=null && groupName!='Favorites') $('#contactList tr:last').append("<td><img src='Images/trash.png' class='removeFromGroup' title='Remove from the group'/></td>");
    }
    if(groupName!=null)  $('#contactList tr:first').before('<tr><th>'+groupName+'</th></tr>');
    $('.removeFromGroup').click(function(event) {
       $contactId=$(event.target).parent().parent().attr('id');
        groupList[groupName].removeContact($contactId);
        $(event.target).text($groupName);
        saved=false;
        sortByGroup(event);
    });
    $('.removeFromGroup').hover(function() {
        $('.removeFromGroup').attr('src','Images/trashondrag.png');
    },
        function() {
            $('.removeFromGroup').attr('src','Images/trash.png');
        });
    updateDragEvent();
}

/*
This function will add a phone number.email address/address when the user create the contact
 */
function addWhenCreate(event) {
    $phone=[],$mail=[],$addr=[];
    $.extend($phone,currentContact.phone);
    $.extend($mail,currentContact.mailList);
    $.extend($addr,currentContact.address);
    $id=$(event.target).parent().parent().attr('id');
    switch($id) {
        case 'createPhone' :
            $phoneName = $('#createPhone td input[type=text]').val();
            $phoneValue = $('#createPhone td input[type=number]').val();
            for (var i in $phone) {
                if (i == $phoneName) {
                    toastr.warning('This number name is already taken.','Warning !');
                    return;
                }
            }
            $phone[$phoneName]=$phoneValue;
            $('#createPhone td input').val('');
            break;
        case 'createMail' :
            $mailName = $('#createMail td input[type=text]').val();
            $mailValue = $('#createMail td input[type=email]').val();
            for (var i in $mail) {
                if (i == $mailName) {
                    toastr.warning('This mail name is already taken.','Warning !');
                    return;
                }
            }
            $mail[$mailName]= $mailValue;
            $('#createMail td input').val('');
            break;
        case 'createNameAddress' :
            $addrName = $('#createNameAddress td input').val();
            $currAddr = [];
            $currAddr[$addrName]=[];
            $currAddr[$addrName]['street'] = $('#createAddress td input ').val();
            $currAddr[$addrName]['postcode'] = $('#createPostcode input ').val();
            $currAddr[$addrName]['city'] = $('#createCity input ').val();
            if ($currAddr[$addrName]['street'] != '' && $currAddr[$addrName]['postcode'] != '' && $currAddr[$addrName]['city'] != '') { //If user enter full address
                for (var i in $addr) {
                    if (i == $addrName) {
                        toastr.warning('This address name is already taken.','Warning !');
                        return;
                    }
                }
            }
            else {
                toastr.error('You did not enter a full address','Error!');
                return;
            }
            $addr[$addrName]=$currAddr[$addrName];
            $('#createNameAddress td input').val('');
            $('#createAddress td input ').val('');
            $('#createPostcode input ').val('');
            $('#createCity input ').val('');
            break;
    }
    currentContact.address=$addr;
    currentContact.phone=$phone;
    currentContact.mailList=$mail;
}
/*
This function will display the contact in the contactList table
@param contact : the Contact to be displayed
 */
function displayNewContact(contact) {
    $('#addCont').css('border-radius','5px');
    $('#addCont').css('border','1px solid #dcdcdc');
    if ($('#contactList tr').length==1) $('#contactList tr').remove();
    $tr="<tr id='"+contact.id+"'><td><img src='"+contact.photo+"' class='contactListImg  img-rounded'/> "+contact.name+", "+contact.getAge()+"</td>";
    $tr+=contact.isBDay()?"<td><img src='Images/BDay.png' class='contactListImg'/></td>":"<td></td>";
    $tr+="<td class='location'><img src='Images/location.png' class='contactListImg'/></td>";
    $fav=null;
    for (var i in groupList) {
        if(groupList[i].name=='Favorites') {
            $fav=groupList[i].hasContact(contact.id);
            break;
        }
    }
    $tr+=$fav?"<td class='fav'><img class='contactListImg' src='Images/isFav.png'/><input type='checkbox' hidden='hidden' checked='checked' /></td>":"<td class='fav'><img class='contactListImg' src='Images/isNotFav.png'/><input type='checkbox' hidden='hidden' /></td>";
    $tr+="<td class='mail'><img class='contactListImg' src='Images/mail.png'/></td></tr>";
    $noneed=false;
    $index=0;
    $('.letter').each(function() {
       if($(this).text()==contact.name.charAt(0).toUpperCase()) {
           $noneed=true;
           $index=$(this).index();
           return false;
       }
    });
    $trLetter='';
    $inserted=false;
    if(!$noneed) $trLetter="<tr class='letter bg-info'><td colspan='5'>"+contact.name.charAt(0).toUpperCase()+"</td></tr>";
    $each=$index==0?"#contactList td:first-child":"#contactList td:first-child:gt("+$index+")";
    $($each).each(function() {
        if($(this).text().split(',')[0].toLowerCase()>contact.name.toLowerCase()) {
            $(this).parent().before($trLetter+$tr);
            $inserted=true;
            return false;
        }
    });
    if(!$inserted) $('#contactList tbody').append($trLetter+$tr);
}
/*
This function will update the draggable event
Called when ne rows appear in the contact list table
 */
function updateDragEvent() {
    $('#contactList td:first-child[colspan!=5]').draggable({
        snap:'.drop',
        helper:'clone',
        cursor:'no-drop'
    });
}

/*
This function will remove a group
@param element : the row containing the name of the group
 */
function removeGroup(element) {
    $name=element.find(':first-child').text();
    delete(groupList[$name]);
    element.remove();
    createContactList(contactList);
    saved=false;
    updateDragEvent();
}

/*
This function will update the droppable event
Called when a group is created
 */
function updateDropGroupEvent() {
    $('.dropGroup').parent().hover(
        function() {//Mouse enter
            if($(this).find('td').text()=='Favorites') return;
            $(this).append("<td class='removeGroup'>X</td>");
            $('.removeGroup').click(function(event) {
                removeGroup($(event.target).parent());
            });
        },
        function() {//Mouse exit
            if($(this).find('td').text()=='Favorites') return;
            $(this).find('.removeGroup').remove();
        }
    );
    $('.dropGroup').click(function(e) {sortByGroup(e)});
    $('.dropGroup').droppable({
        over:function(event,ui) {
            if($(event.target).text()=='Favorites') return;
            $(event.target).css('background-color','#ddd');
            $(ui.helper).css({cursor:'copy'});
        },
        out:function(event,ui) {
            if($(event.target).text()=='Favorites') return;
            $(event.target).css('background-color','white');
            $(ui.helper).css({cursor:'no-drop'});
        },
        drop:function(event,ui) {
            $(event.target).css('background-color','white');
            if($(event.target).text()=='Favorites') return;
            $idContact=$(ui.draggable.parent()).attr('id');
            $groupName=$(event.target).text();
            if(groupList[$groupName].addContact($idContact)) toastr.info('Contact added to the group','Success');
            else toastr.info('The contact is already in the group','Error');
            createContactList(contactList);
            return;
        }
    });
}

/*
This function will show the contact whose Bday is today or tomorrow
and propose to wish them.
@param contactListBday : Array of Contact with 2 index ["today"] & ["tomorrow"]
each of them containing Contact whose Bday is today/tomorrow
 */
function wishBDay(contactListBday) {
    $mess='';
    if(contactListBday['today']!=null) {
        $mess+="<h4>It's their birthday today ! Wish them a happy birthday !</h4><ul class='list-group'>";
        for (var i in contactListBday['today']) {
            $contact=contactListBday['today'][i];
            $mess+="<li id='"+$contact.id+"' class='contactBday list-group-item'><img class='img img-rounded' src='"+$contact.photo+"'/>"+$contact.name+", Age "+$contact.getAge()+" years old <img src='Images/fb.png' id='fbBday'/><img src='Images/chat.png' id='chatBday'/><img src='Images/call.png' id='callBday'/></li>";
        }
        $mess+='</ul><script>' +
            "$('#fbBday').click(function(e) {" +
            "$c=null;for (var i in contactList) {if(contactList[i].id==$(e.target).parent().attr('id')) {$c=contactList[i];break;}}" +
            "window.open($c.fb);});" +
            "$('#chatBday').click(function(e) {" +
            "$c=null;for (var i in contactList) {if(contactList[i].id==$(e.target).parent().attr('id')) {$c=contactList[i];break;}}" +
            "window.location='skype:'+$c.skype+'?chat';});" +
            "$('#callBday').click(function(e) {" +
            "$c=null;for (var i in contactList) {if(contactList[i].id==$(e.target).parent().attr('id')) {$c=contactList[i];break;}}" +
            "window.location='skype:'+$c.skype+'?call';});" +
            "</script>";
    }
    if(contactListBday['tomorrow']!=null) {
        if(contactListBday['today']!=null) $mess+="<hr>";
        $mess+="<h5>Don't forget their birthday is tomorrow !</h5><ul class='list-group'>";
        for (var i in contactListBday['tomorrow']) {
            $contact=contactListBday['tomorrow'][i];
            $mess+="<li class='list-group-item'><img class='img img-rounded' src='"+$contact.photo+"'/>"+$contact.name+", will be "+($contact.getAge()+1)+" years old</li>";
        }
        $mess+='</ul>';
    }
    bootbox.dialog({
        title:'Today and tomorrow\'s birthdays',
        message:$mess,
        buttons:{
            success:{
                label:'OK',
                className:'btn-success',
                callback:function() {return;}
            }
        }
    });
}