/**
 * Created by Clément on 28/10/2015.
 */
var nbContact=0;
function Contact() {
    this.id=0;
    this.name='';
    this.fb='';
    this.skype='';
    this.maritalStat='';
    this.photo='';
    this.phone=[];
    this.address=[];
    this.mailList=[];
    this.dob=new Date();
    this.inDB=false;
    this.modified=false;
}
Contact.prototype.getPhone=function() {return this.phone;}

/*
This method will return the age of the contact
 */
Contact.prototype.getAge=function () {
    var yo=new Date().getFullYear()-this.dob.getFullYear();
    var month=new Date().getMonth()-this.dob.getMonth();
    if(month<0 || (month===0 && new Date().getDate()<this.dob.getDate())) yo--;
    return a=yo==NaN?0:yo;
}

/*
This method will return a short description of the contact (used in mail)
 */
Contact.prototype.getShortDesc=function(phoneName,addressName,mailName) {
    /*
    Name
    Phone name : Phone
    Mail name : Mail
    Address name : Address
    Postcode City
    */
    var addr=addressName+' : '+this.address[addressName]['street']+'\n'+this.address[addressName]['postcode']+' '+this.address[addressName]['city']+'\n';
    return this.name+'\n'+phoneName+' : '+this.phone[phoneName]+"\n"+mailName+' : '+this.mailList[mailName]+"\n"+addr;
}

Contact.prototype.isBDayTomorrow=function() {
    var tomorrow=new Date();
    tomorrow.setDate(tomorrow.getDate()+1);
    return this.dob.getDate()==tomorrow.getDate() && this.dob.getMonth()==tomorrow.getMonth();
}

Contact.prototype.isBDay=function() {
    return this.dob.getDate()==new Date().getDate() && this.dob.getMonth()==new Date().getMonth();
}

/*
This method will modify any information about the contact
 */
Contact.prototype.modify=function(info) {
    this.name=info['name'];
    if(this.id==0 && info['id']==null) {
        nbContact++;
        this.id=nbContact;
    }
    else {
        this.id=info['id'];
        nbContact=info['id']>nbContact?info['id']:nbContact;
    }
    this.fb=info['fb'];
    this.skype=info['skype'];
    this.maritalStat=info['maritalStat'];
    this.photo=info['photo'];//Representative string in the DB
    this.phone=info['phone'];
    this.address=info['address'];
    this.mailList=info['mail'];
    this.dob=new Date(info['dob']);
    this.inDB=info['inDB'];
}

/*
This method will return the latitude and longitude of the contact's adress
 */
Contact.prototype.getLocation=function(addressName) {
    var addr=this.address[addressName]['street']+','+this.address[addressName]['postcode']+','+this.address[addressName]['city'];
    addr.replace(' ','+');
    return addr;
}


/*
Class representing a group of contact
name : name of the group
contact : list of contact ids belonging to the group
 */

function Group(name) {
    this.name=name;
    this.contact=[];
}


Group.prototype.hasContact=function(contactId) {
    var returnValue=false;
    for (var c in this.contact) {
        if(this.contact[c]==contactId) returnValue=true;
    }
    return returnValue;
}

Group.prototype.addContact=function(contactId) {
    if (!this.hasContact(contactId)) {
        this.contact.push(contactId);
        return 1;
    }
    else return 0;
}
Group.prototype.removeContact=function(contactId) {
    for (var i in this.contact) {
        if(this.contact[i]==contactId) {
            this.contact.splice(i,1);
            return;
        }
    }
}