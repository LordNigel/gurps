//Thanks to Codimu36 for the GUHE refactor here and Freeze for teach me the basic
//Thanks for Chris Normand for the inspiration!
if (canvas.tokens.controlled.length == 0)
  ui.notifications.error("I don't have a crystal ball, please select one token!")

let dialogTemplate = `<style>

    #buttons-dialog .dialog-content { 
      text-align: center;
      font-size: 20px;
      padding-bottom: 8px;
      padding-top: 8px; 
      font-family: "Signika";
      Background-color: Orange;
      border-radius: 15px;
      Color:White;
    }
    #buttons-dialog .dialog-buttons { 
      margin: 0 auto;
      width: 100%; /* Remove this line -- it is superseded by the 'width' variable a few lines down. */
      padding-top: 8px; 
      background-color: #00000;
      background-size: 50px 50px;
      background-repeat: no-repeat;
      background-position: center;
      width: 384px; /* Add 52 to this number per button added. */
      height: 90px;
    }                        
    #buttons-dialog .dialog-buttons .reset {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .step {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;                                    
      background-image: url("systems/gurps/icons/statuses/x-haste.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .prepare {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      background-image: url("systems/gurps/icons/statuses/path-condition-grappled.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .stun {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      background-image: url("systems/gurps/icons/statuses/dd-condition-stunned.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .nodef {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      background-image: url("systems/gurps/icons/statuses/path-condition-helpless.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .fp {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      background-image: url("systems/gurps/icons/statuses/x-drowsy.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .select {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      background-image: url("systems/gurps/icons/statuses/cth-condition-readied.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
    #buttons-dialog .dialog-buttons .stop {
      margin: 0 auto;
      width: 100%;
    }
    /* Add a new button style with title "foo". */
    #buttons-dialog .dialog-buttons .foo {
      margin: 0 auto;
      width: 100%;
      border-radius: 15px;
      /* Here is where you set the icon on the button. */
      background-image: url("systems/gurps/icons/statuses/dd-condition-stunned-iq.webp");
      background-color: #ffffff;
      background-size: 90% 80%;
      background-repeat: no-repeat;
      background-position: center;
    }
  </style>
`

var input = [
  {
    title: 'reset',
    name: 'Reset',
    icon: 'power-off',
    otf: '/st clear',
    audio_src: 'reset.wav',
  },
  {
    title: 'step',
    name: '',
    icon: '',
    otf: '/st t sprint',
    audio_src: 'pop.mp3',
  },
  {
    title: 'prepare',
    name: '',
    icon: '',
    otf: '/st t grapple',
    audio_src: 'pop.mp3',
  },
  {
    title: 'stun',
    name: '',
    icon: '',
    otf: '/st t stun',
    audio_src: 'pop.mp3',
  },
  {
    title: 'nodef',
    name: '',
    icon: '',
    otf: '/st t agony',
    audio_src: 'pop.mp3',
  },
  {
    title: 'fp',
    name: '',
    icon: '',
    otf: '/fp -1',
    audio_src: 'pop.mp3',
  },
  {
    title: 'select',
    name: '',
    icon: '',
    otf: '/:Select Multiple Targets',
    audio_src: 'pop.mp3',
  },
  {
    comment: '/* Add the button to the list. */',
    title: 'foo',
    name: '',
    icon: '',
    otf: '/st t mentalstun',
    audio_src: 'pop.mp3',
  },
]

var buttons = input.reduce((buttonObj, buttonData) => {
  buttonObj[buttonData.title] = {
    icon: `<i class='fas fa-${buttonData.icon}'></i>`,
    label: buttonData.name,
    callback: () => {
      GURPS.executeOTF(buttonData.otf)
      dialogEditor.render(true)
      AudioHelper.play(
        {
          src: `modules/gurps-instant-defaults/packs/${buttonData.audio_src}`,
          volume: 0.8,
          autoplay: true,
          loop: false,
        },
        true
      )
    },
  }
  return buttonObj
}, {})

//*buttons.stop = {
//    label: "Close",
//}

let dialogEditor = new Dialog(
  {
    title: `GURPS Instant Defaults`,
    content: dialogTemplate + `Choose your status!`,
    buttons: buttons,
    //  default: "close",
    //  close: () => {}
  },
  {
    id: 'buttons-dialog',
    /* Add the following line. It will make the dialog big enough to display any number of buttons to the size of the Foundry window. */
    width: undefined,
  }
)

dialogEditor.render(true)
