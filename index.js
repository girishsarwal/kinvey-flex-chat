
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
            console.log(context);
            let messageId = context.entityId;
            modules.dataStore().collection('messages').findById(messageId, (err, found)=>{
                if(err) {
                    return complete().runtimeError("cannot find message to update");
                }
                let res = found.content.to.map(function(a){
                    a.read = a.read || context.body.content.to.find(b => b.user == a.user).read;
                    return a;
                });
                context.body.content.to = res;
                return complete().setBody(context.body).next();
            })
        }
    });
});