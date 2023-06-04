const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const base64 = require('base-64');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.metadata',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://mail.google.com/'
    ];

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function authorize() {

  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  
  return client;
}


async function listLabels(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    let res = await gmail.users.labels.list({userId : 'me'});
    const labels = res.data.labels;
    let flag = 0;
    labels.forEach((label)=>{
        if(label.name === "Check Label"){
            flag = 1;
            return;
        }
    })
    if(flag == 1)   return;
    gmail.users.labels.create({
        userId : 'me',
        resource : {
            "labelListVisibility": "labelShow",
            "messageListVisibility": "show",
            "name": "Check Label"
        }
    })

}

async function checkNewMessages(auth){
    const gmail = google.gmail({version: 'v1', auth});
    try{
        let res = await gmail.users.getProfile({userId : 'me'});
        return res.data.messagesTotal;
    }catch(e){
        console.log(e);
    }
}

async function replyToEmail(auth,count){
    const gmail = google.gmail({version : 'v1' ,auth});

    let res = await gmail.users.messages.list({
        userId : "me",
        includeSpamTrash : false,
        maxResults : 5,
    })

    let messages = res.data.messages;

    // console.log(messages);

    // messages.forEach((item)=>{
    //     sendEmails(item)
    // })

    let base64email = "From: Test Account <portacc85@gmail.com> To: Ksheetiz <ksheetiz43@gmail.com> Subject: This is just an test email Date: Fri, 21 Nov 1997 09:55:06 -0600 Message-ID: <1234@local.machine.example>This is a message just to say hello."
    base64email = base64.encode(base64email);

    let Res = await gmail.users.messages.send({
        userId : 'me',
        resource : {
            raw : base64email,
            payload : {
                "headers": [
                  {
                    "name": "to",
                    "value": "ksheetiz43@gmail.com"
                  },
                  {
                    "name": "from",
                    "value": "portacc85@gmail.com"
                  },
                  {
                    "name": "subject",
                    "value": "(no subject)"
                  }
                ],
                "mimeType": "text/plain",
                "partId": "6969"
              }
        }
    });


}

async function startFunction(auth) {
    listLabels(auth);
    let emails = 0;

        setTimeout( () =>{
            console.log("Checking Email")
        }, 5000);

        let messages = checkNewMessages(auth);
        
        if(emails == 0)
            emails = messages;
        

            replyToEmail(auth,messages-emails)
}

authorize().then(startFunction).catch(console.error);