/**
 * Created by Clément on 03/11/2015.
 */
function Database() {
    this.dataB={};
    this.dataB.webdb={};
    this.dataB.db=null;

}


Database.prototype.open=function() {
    var dbSize=5*1024*1024;
    this.dataB.webdb.db=openDatabase('ContactBook','1','ContactBook project web database',dbSize);
}

Database.prototype.error=function(tx,e) { console.log('Database error: '+e);}

Database.prototype.success=function(tx,rs) {}

Database.prototype.createTable=function() {
    var db=this.dataB.webdb.db;
    db.transaction(function (tx) {
        tx.executeSql('create table if not exists contact (idContact integer unique primary key not null, name text not null, photo text, skype text, fb text, maritalStat text, dob text,inDB boolean);');
        tx.executeSql('create table if not exists contactGroup (idContact integer not null, groupName text);');
        tx.executeSql('create table if not exists phone (idContact integer not null, phoneName text, phoneNumber text not null);');
        tx.executeSql('create table if not exists mail (idContact integer not null, mailName text, mailAddress text not null);');
        tx.executeSql('create table if not exists address (idContact integer not null, addrName text, street text not null, postcode text not null, city text not null);');
    });
}

Database.prototype.insertContact=function(contact) {
    var db=this.dataB.webdb.db;
    var phone=contact.phone;
    var mail=contact.mailList;
    var addr=contact.address;
    var phoneReq=[];
    var mailReq=[];
    var addrReq=[];
    for (var i in phone) {
        phoneReq.push("insert into phone values ("+contact.id+",\""+i+"\",\""+phone[i]+"\");");
    }
    for (var i in mail) {
        mailReq.push("insert into mail values ("+contact.id+",\""+i+"\",\""+mail[i]+"\");");
    }
    for (var i in addr) {
        var street=addr[i]['street'];
        var city=addr[i]['city'];
        var postcode=addr[i]['postcode'];
        addrReq.push("insert into address values ("+contact.id+",\""+i+"\",\""+street+"\",\""+postcode+"\",\""+city+"\");");
    }
    db.transaction(function(tx) {
        if(contact.modified && contact.inDB) {
            tx.executeSql('delete from contact where idContact=?;',[contact.id],this.success,this.error);
            tx.executeSql('delete from phone where idContact=?;',[contact.id],this.success,this.error);
            tx.executeSql('delete from mail where idContact=?;',[contact.id],this.success,this.error);
            tx.executeSql('delete from address where idContact=?',[contact.id],this.success,this.error);
        }
        tx.executeSql('insert into contact values (?,?,?,?,?,?,?,1);',[contact.id,contact.name,contact.photo,contact.skype,contact.fb,contact.maritalStat,contact.dob],this.success,this.error);
        for (var i in phoneReq) {tx.executeSql(phoneReq[i]);}
        for (var i in mailReq) {tx.executeSql(mailReq[i]);}
        for (var i in addrReq) {tx.executeSql(addrReq[i]);}
    });
}

Database.prototype.removeContact=function(idContact) {
    var db=this.dataB.webdb.db;
    db.transaction(function(tx) {
        tx.executeSql('delete from contact where idContact=?',[idContact],this.success,this.error);
        tx.executeSql('delete from contactGroup where idContact=?',[idContact],this.success,this.error);
        tx.executeSql('delete from phone where idContact=?',[idContact],this.success,this.error);
        tx.executeSql('delete from mail where idContact=?',[idContact],this.success,this.error);
        tx.executeSql('delete from address where idContact=?',[idContact],this.success,this.error);
    });
}

Database.prototype.removeGroups=function() {
    var db=this.dataB.webdb.db;
    db.transaction(function(tx) {
        tx.executeSql('delete from contactGroup');
    });
}

Database.prototype.affectContactGroup=function(idContact,groupName) {
    var db=this.dataB.webdb.db;
    db.transaction(function (tx) {
        tx.executeSql('insert into contactGroup values (?,?)',[idContact,groupName],this.success,this.error);
    });
}

Database.prototype.getAllContact=function(callback) {
    var db=this.dataB.webdb.db;
    db.transaction(function(tx) {
        tx.executeSql('select * from contact',[],function(tx,rs) {
            var ret=toContactObject(tx,rs);
            callback(ret);
        },this.error);
    });
}

Database.prototype.getAllGroup=function(callback) {
    var db=this.dataB.webdb.db;
    db.transaction(function (tx) {
        tx.executeSql('select * from contactGroup',[],function(tx,rs) {
            var ret=toGroupObject(tx,rs);
            callback(ret);
        },this.error);
    });
}

Database.prototype.getPhone=function(callback) {
    var db=this.dataB.webdb.db;
    db.transaction(function(tx) {
        tx.executeSql('select * from phone',[],function(tx,rs) {
            var ret=toPhoneObject(tx,rs);
            callback(ret);
        },this.error);
    });
}

Database.prototype.getMail=function(callback) {
    var db=this.dataB.webdb.db;
    db.transaction(function(tx) {
        tx.executeSql('select * from mail',[],function(tx,rs) {
            var ret=toMailObject(tx,rs);
            callback(ret);
        },this.error);
    });
}

Database.prototype.getAddress=function(callback) {
    var db=this.dataB.webdb.db;
    db.transaction(function(tx) {
        tx.executeSql('select * from address',[],function(tx,rs) {
            var ret=toAddressObject(tx,rs);
            callback(ret);
        },this.error);
    });
}

/*
This method will convert the database data into a List of Contact Object
 */
var toContactObject=function(tx,rs) {
    var contactList=[];
    var currentContact=new Contact();
    var info=[];
    var currentRow;
    for (var i=0;i< rs.rows.length;i++) {
        currentRow=rs.rows.item(i);
        info['id']=currentRow.idContact;
        info['name']=currentRow.name;
        info['photo']=currentRow.photo;
        info['fb']=currentRow.fb;
        info['skype']=currentRow.skype;
        info['maritalStat']=currentRow.maritalStat;
        info['dob']=currentRow.dob;
        info['inDB']=true;
        currentContact.modify(info);
        contactList.push(currentContact);
        currentContact=new Contact();
    }
    return contactList;
}

/*
This method will convert the database data into a List of Group Object
 */
var toGroupObject=function(tx,rs) {
    var groupList=[];
    var currentRow;
    for (var i=0;i< rs.rows.length;i++) {
        currentRow=rs.rows.item(i);
        if(groupList[currentRow.groupName]==null) {
            groupList[currentRow.groupName]=new Group(currentRow.groupName);
            groupList[currentRow.groupName].addContact(currentRow.idContact);
        }
        else groupList[currentRow.groupName].addContact(currentRow.idContact);
    }
    return groupList;
}

var toPhoneObject=function(tx,rs) {
    var phoneList=[];
    var currentRow,phoneName,phoneNumber;
    for (var i=0;i< rs.rows.length;i++) {
        currentRow=rs.rows.item(i);
        phoneName=currentRow.phoneName;
        phoneNumber= currentRow.phoneNumber;
        phoneList[currentRow.idContact]=phoneList[currentRow.idContact]==null?[]:phoneList[currentRow.idContact];
        phoneList[currentRow.idContact][phoneName]=phoneNumber;
    }
    return phoneList;
}

var toMailObject=function(tx,rs) {
    var mailList=[];
    var currentRow,mailName,mailAddress,x;
    for (var i=0;i< rs.rows.length;i++) {
        currentRow=rs.rows.item(i);
        mailName=currentRow.mailName;
        mailAddress=currentRow.mailAddress;
        mailList[currentRow.idContact]=mailList[currentRow.idContact]==null?[]:mailList[currentRow.idContact];
        mailList[currentRow.idContact][mailName]=mailAddress;
    }
    return mailList;
}
var toAddressObject=function(tx,rs) {
    var addrList = {};
    var currentRow, addrName;
    for (var i = 0; i < rs.rows.length; i++) {
        currentRow = rs.rows.item(i);
        addrName = currentRow.addrName;
        addrList[currentRow.idContact] = addrList[currentRow.idContact] == null ? [] : addrList[currentRow.idContact];
        addrList[currentRow.idContact][addrName] = {
            street: currentRow.street,
            city: currentRow.city,
            postcode: currentRow.postcode
        };
    }
    return addrList;
}