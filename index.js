
/** pre save hook for a chat messaging
 * girish sarwal (girish@kinvey.com)
 * this hook "forward updates" the read status of multiple recipients
 * 
 */
const sdk = require('kinvey-flex-sdk');
sdk.service((err, flex) => {
    if(err){
        console.log("could not initialize flex!");
        return;
    }
    let f = flex.functions;
    f.register('onPreSave', function(context, complete, modules){
        if(context.method ==='POST'){
            /** this is a new message */
            let entity = modules.kinveyEntity.entity(context.body);
            entity.content.to.forEach(item => {
                entity._acl.addWriter(item.user);
            });
            console.log(entity);
            return complete().setBody(entity).created().next();
        } else if (context.method === 'PUT'){
            /** this is an update to an exsiting message */
            console.log(context);
            let messageId = context.entityId;
            modules.dataStore().collection('messages').findById(messageId, (err, found)=>{
                if(err) {
                    return complete().runtimeError("cannot find message to update");
                }
                let res = found.content.to.map(function(a){
                    /** for each recipient, the read status needs to be the 
                     * existing read status || the new status that has been passed in the request 
                     * **/
                    a.read = a.read || context.body.content.to.find(b => b.user == a.user).read;
                    return a;
                });
                context.body.content.to = res;
                return complete().setBody(context.body).next();
            })
        }
    });
    
});


/** Sample paytloads
 * */

/** 
 * New Chat Message
 * 
 * POST /appdata/kid_HkasmodbE/messages
 * 
 * {
  "content": {
    "subject": "HNY!",
    "body": "Wish you a very Happy new year 2019!",
    "from": "5c2b289b9ff0ad454ed1bb2b",
    "to": [
      {
        "user": "5c2b28ac32909717a6cbb419",
        "read": false,
        "read_at": null
      },
      {
        "user": "5c2b28a44c560211479439b3",
        "read": false,
        "read_at": null
      }
    ]
  }
}
*/

/** Existing Chat Message (recipient marks read) 
 * Recipient only changes his read flag to true
 * 
 * PUT /appdata/kid_HkasmodbE/messages/{messageId}
 * 
 * {
  "content": {
    "subject": "HNY!",
    "body": "Wish you a very Happy new year 2019!",
    "from": "5c2b289b9ff0ad454ed1bb2b",
    "to": [
      {
        "user": "5c2b28ac32909717a6cbb419",
        "read": true,
        "read_at": null
      },
      {
        "user": "5c2b28a44c560211479439b3",
        "read": false,
        "read_at": null
      }
    ]
  }
}
*/