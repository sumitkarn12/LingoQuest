const db = new Dexie("TranslationApp");
db.version(1).stores({ questions: '++id,challenge,hindi_sentence' });
const store = createPuffStore( "tense-app" );

const isCorrect = ( givenAnswer, correctAnswer ) => {
  if ( !givenAnswer || !correctAnswer ) return false;
  let doc = nlp( givenAnswer );
  givenAnswer = doc.contractions().expand().all().text();
  givenAnswer = givenAnswer.replaceAll(/\W$/gi, "");
  correctAnswer = correctAnswer.trim().replaceAll(/\W$/gi, "");
  return givenAnswer.toLowerCase() == correctAnswer.toLowerCase();
}
function formatDuration(ms) {
  if (ms <= 0) return "0";

  // Define time conversions in milliseconds
  const SECOND = 1000;
  const MINUTE = SECOND * 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;

  // Extract individual units using math remainder operations
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const seconds = Math.floor((ms % MINUTE) / SECOND);

  // Build an array of label pairs
  const parts = [
    // { value: days, label: days === 1 ? 'day' : 'days' },
    // { value: hours, label: hours === 1 ? 'hour' : 'hours' },
    { value: minutes, label: minutes === 1 ? 'min' : 'mins' },
    { value: seconds, label: seconds === 1 ? 'sec' : 'secs' }
  ];

  // Filter out any zero units and join the remaining text strings
  return parts
    // .filter(part => part.value > 0)
    .map(part => (part.value<10?"0":"")+part.value)
    // .map(part => `${part.value} ${part.label}`)
    // .join(' ');
    .join(':');
}
const getEmoji = (() => {
  const m = new Map(), em = ["🎯", "⚔️","🏆", "💪", "💡", "🤔", "🚀", "💥", "🧠", "🧐", "📝", "⚡", "📌", "🧗🏻", "📢", "🏁", "🥇","🥈","🎖️","🥉"];
  return str => m.get(str) || m.set(str, em[[...str].reduce((a, c) => a + c.charCodeAt(0), 0) % em.length]).get(str);
})();
function getPaginationIndexes(currentIndex, totalNumbers, windowSize = 5, middlePosition = 2) {
  let start = currentIndex - middlePosition;
  start = Math.max(0, start);
  start = Math.min(start, totalNumbers - windowSize);
  const numbers = [];
  for (let i = 0; i < windowSize; i++) {
    numbers.push(start + i);
  }
  return numbers;
}
const getTenseFormula = ( challenge ) => {
  let tenseFormulas = {
      "present_simple": {
          affirmative: "Sub + V1 (-s/es) + Obj",
          negative: "Sub + do/does + not + V1 + Obj",
          interrogative: "Do/Does + Sub + V1 + Obj?"
      },
      "present_continuous": {
          affirmative: "Sub + is/am/are + V1-ing + Obj",
          negative: "Sub + is/am/are + not + V1-ing + Obj",
          interrogative: "Is/Am/Are + Sub + V1-ing + Obj?"
      },
      "present_perfect": {
          affirmative: "Sub + has/have + V3 + Obj",
          negative: "Sub + has/have + not + V3 + Obj",
          interrogative: "Has/Have + Sub + V3 + Obj?"
      },
      "present_perfect_continuous": {
          affirmative: "Sub + has/have + been + V1-ing + Obj + for/since + Time",
          negative: "Sub + has/have + not + been + V1-ing + Obj + for/since + Time",
          interrogative: "Has/Have + Sub + been + V1-ing + Obj + for/since + Time?"
      },
      "past_simple": {
          affirmative: "Sub + V2 + Obj",
          negative: "Sub + did + not + V1 + Obj",
          interrogative: "Did + Sub + V1 + Obj?"
      },
      "past_continuous": {
          affirmative: "Sub + was/were + V1-ing + Obj",
          negative: "Sub + was/were + not + V1-ing + Obj",
          interrogative: "Was/Were + Sub + V1-ing + Obj?"
      },
      "past_perfect": {
          affirmative: "Sub + had + V3 + Obj",
          negative: "Sub + had + not + V3 + Obj",
          interrogative: "Had + Sub + V3 + Obj?"
      },
      "past_perfect_continuous": {
          affirmative: "Sub + had + been + V1-ing + Obj + for/since + Time",
          negative: "Sub + had + not + been + V1-ing + Obj + for/since + Time",
          interrogative: "Had + Sub + been + V1-ing + Obj + for/since + Time?"
      },
      "future_simple": {
          affirmative: "Sub + will + V1 + Obj",
          negative: "Sub + will + not + V1 + Obj",
          interrogative: "Will + Sub + V1 + Obj?"
      },
      "future_continuous": {
          affirmative: "Sub + will + be + V1-ing + Obj",
          negative: "Sub + will + not + be + V1-ing + Obj",
          interrogative: "Will + Sub + be + V1-ing + Obj?"
      },
      "future_perfect": {
          affirmative: "Sub + will + have + V3 + Obj",
          negative: "Sub + will + not + have + V3 + Obj",
          interrogative: "Will + Sub + have + V3 + Obj?"
      },
      "future_perfect_continuous": {
          affirmative: "Sub + will + have + been + V1-ing + Obj + for/since + Time",
          negative: "Sub + will + not + have + been + V1-ing + Obj + for/since + Time",
          interrogative: "Will + Sub + have + been + V1-ing + Obj + for/since + Time?"
      }
  };
  challenge = challenge.toLowerCase().split(" ").join("_");
  return tenseFormulas[challenge];
}
const debounce = (func, delay = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    const context = this;
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

const Layout = {
  view: function(vnode) {
    return m(".container", [vnode.children, m(AppConfig)]);
  }
}
const Model = {
  q: [],
  m: new Map(),
  load: () => db.questions.toArray(r => {
      Model.q = r;
      return Model.meta();
    }
  ),
  size: () => Model.q.length,
  get: (id) => {
    return Model.q.filter(f => f.id == id)
  },
  getFirst: (id) => Model.get(id)[0],
  getByChallenge: (challenge) => Model.q.filter(f => f.challenge == challenge),
  nextAvailableQuestion: (challenge) => {
    let qs = Model.getByChallenge(challenge);
    for (let i = 0; i < qs.length; i++) {
      let s = qs[i].score || 0;
      if (s < 3) return i;
    }
    return 0;
  },
  nextAvailableChallenge: () => {
    let m = Model.meta();
    let keys = Array.from(m.keys());
    for ( let i = 0; i<keys.length;i++) {
      if ( m.get( keys[i] ).score < m.get(keys[i]).count*3 ) return keys[i];
    }
    console.log( "No next" );
    return null;
  },
  meta: () => {
    let m = Model.m;
    if ( m.size ) return m;
    m = new Map();
    Model.q.forEach(q => {
      let a = m.get(q.challenge) || {};
      a.score = (a.score || 0) + (q.score || 0)
      a.count = (a.count || 0) + 1
      a.touched = (a.touched || 0) + ((q.aff_sol || q.neg_sol || q.int_sol) ? 1 : 0);
      a.time_taken = (a.time_taken || 0) + (q.time_taken || 0);
      m.set(q.challenge, a);
    });
    return m;
  },
  getFirstTroubledQuestionIndex: (challenge) => {
    let qs = Model.getByChallenge(challenge);
    for (let i = 0; i < qs.length; i++) {
      if ((qs[i].score || 0) < 3) {
        return i;
      }
    }
    return 0;
  },
  put: ( p ) => db.questions.put( p ).then( () => Model.load() ),
  sanitizeChallengeName: (c) => c.replace(/^\d+\.\s*|\s*-\d+$/g, "")
}
const I = {
  view: (vnode) => {
    return m("span.material-symbols-rounded", vnode.children);
  }
}
const Loading = {
  view: function (vnode) {
    db.questions.count(c => {
      if (c) return m.route.set("challenges");
      fetch("https://api.npoint.io/bb12b8dd995e7ae59512")
        .then(res => res.ok ? res.json() : res.text())
        .catch(console.error)
        .then(async (data) => {
          await db.questions.clear();
          await db.questions.bulkAdd(data);
          m.route.set("challenges")
        });
    })

    return m("#loading",
      m('button.button.is-loading.is-large', "Loading data...")
    );
  }
}
const AppConfigModel = {
  is_muted: false,
  is_completed_hidden: false,
  last_selected_tab: store.getState("last_selected_tab") || "Present",
  setMute: (ev) => {
    AppConfigModel.is_muted = !AppConfigModel.is_muted;
    SonicFX.setMute(AppConfigModel.is_muted );
    SonicFX.success();
    store.setState( "is_muted", AppConfigModel.is_muted );
  },
  setCompletedHidden: (ev) => {
    AppConfigModel.is_completed_hidden = !AppConfigModel.is_completed_hidden;
    store.setState( "is-completed-hidden", AppConfigModel.is_completed_hidden );
  },
  setLastSelectedTab: ( name ) => {
    AppConfigModel.last_selected_tab = store.setState( "last_selected_tab", name );
  }
}
const AppConfig = {
  oninit: function(vnode) {
    AppConfigModel.is_muted = store.getState("is_muted") || false;
    AppConfigModel.is_completed_hidden = store.getState( "is-completed-hidden" ) || false;
    SonicFX.setMute( AppConfigModel.is_muted );
  },
  download: async (ev) => {
    let d = await db.questions.toArray();
    d = JSON.stringify( d );
    let compd = LZString.compressToEncodedURIComponent( d );

    const file = new Blob([compd], { type: 'text/plain;charset=utf-8' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(file);
    element.download = (new Date()).toLocaleString().replaceAll(/\D+/gi,"")+".txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  },
  upload: async ( txt ) => {
    let decompd = LZString.decompressFromEncodedURIComponent( txt );
    let parsed = JSON.parse( decompd );
    let is_confirmed = await AsyncPop.confirm(`Data will be replaced. You are uploading ${parsed.length} questions.`, "⚠️ Are you sure?");
    if ( is_confirmed ) {
      parsed = parsed.map( q => {
        q.imported_at = new Date();
        return q;
      });
      await db.questions.bulkPut( parsed );
      Model.load();
      await AsyncPop.alert( "You may need to reload the page.", "🥳 Done!" );
    }
  },
  view: function( vnode ) {
    return m(".p-5#app-config-control", 
      m(".tabs.is-toggle.is-centered.is-toggle-rounded.is-small", { key: 1 }, m("ul", [
        m("li", { class: AppConfigModel.is_muted?"is-active":""},
          m("a", { onclick: AppConfigModel.setMute  }, m("span.icon", m(I, AppConfigModel.is_muted?"volume_off":"volume_up")))
        ),
        m("li", { class: AppConfigModel.is_completed_hidden ? "is-active" : "" }, m("a", {onclick: AppConfigModel.setCompletedHidden}, m(I, AppConfigModel.is_completed_hidden?"grid_off":"grid_on"))),
        m("li", m("a", {onclick: AppConfig.download}, m(I, "download"))),
        m("li", m("a", {onclick: ev => document.querySelector("#upload").click() }, [
          m("input[type=file]#upload",{onchange: async ev => {
            let file = ev.target.files[0];
            ev.target.value = ""
            if ( !file.type.includes("text") )
            return Toastify({ text: "Invalid file type." }).showToast();
            let txt = await file.text();
            await AppConfig.upload( txt );
          }}), m(I, "upload")
        ])),
      ]))
    )
  }
}
const FooterControl = {
  createNewChallenge: async function( ev ) {
    const els = document.querySelectorAll(".challenge-card-wrapper .selector:checked");
    let selectedChallenges = Array.from(els).map( el =>  el.dataset.name ).filter( k => !k.startsWith("CUSTOM"));
    if ( !selectedChallenges.length ) return Toastify({ text: "Please remove custom challenges.", position: "center", close: true, duration: 10*1000, style: { background: "tomato" } }).showToast();
    let name = await AsyncPop.prompt("Give it a name.");
    name = `CUSTOM-${name || (new Date()).toLocaleString()}-${Math.ceil(Math.random() * 100)}`;
    let count = await AsyncPop.prompt("How many questions?");
    count = count*1;
    if ( isNaN(count) ) return Toastify({ text: "Enter a valid number.", position: "center" }).showToast()
    let challenges = await db.questions.where("challenge").anyOf( selectedChallenges ).toArray();
    challenges = challenges.sort((a, b) => Math.random() - 0.5).slice(0, count).map( q => {
      return {
        hindi_sentence: q.hindi_sentence,
        affirmative: q.affirmative,
        negative: q.negative,
        interrogative: q.interrogative,
        challenge: name
      }
    });
    let a = await db.questions.bulkAdd( challenges );
    Model.load().then( () => {
      Toastify({ text: `"${Model.sanitizeChallengeName(name).replace("CUSTOM-", "")}" created.`, position: "center" }).showToast()
      FooterControl.deselect();
    })
  },
  removeChallenge: async function( ev ) {
    const els = document.querySelectorAll(".challenge-card-wrapper .selector:checked");
    let selection = Array.from(els).map( el =>  el.dataset.name ).filter( f => f.toLowerCase().startsWith( "custom" ));
    if ( !selection.length ) return Toastify({ text: "Only custom created test can be deleted.", position: "center", duration: 10*1000, close: true, style: { background: "tomato"} }).showToast();
    let res = await db.questions.where("challenge").startsWithAnyOfIgnoreCase( selection ).delete();
    Model.load().then( () => {
      Toastify({ text: "Deleted", position: "center", }).showToast()
      FooterControl.deselect();
    })
  },
  selectAll: function( ev ) {
    const els = document.querySelectorAll(".challenge-card-wrapper .selector");
    els.forEach( el =>  el.checked = true );
  },
  deselect: function( ev ) {
    const els = document.querySelectorAll(".challenge-card-wrapper .selector:checked");
    els.forEach( el => el.checked = false );
  },
  view: function( vnode ) {
    return m("div#footer-control.is-flex.is-gap-2.p-4", [
      m("button.button.is-primary", { onclick: FooterControl.createNewChallenge }, m(I, "add")),
      m("button.button.is-danger", { onclick: FooterControl.removeChallenge }, m(I, "delete")),
      m("button.button", { onclick: FooterControl.selectAll }, m(I, "select_all")),
      m("button.button", { onclick: FooterControl.deselect }, m(I, "deselect"))
    ])
  }
}
const Hint = {
  oninit: function (vnode) {
    vnode.state.currentQId = vnode.attrs.qId;
    vnode.state.delay = store.getState("hint-delay");
    vnode.state.intv = null;
    vnode.state.startTimer = () => {
      if (vnode.state.intv) clearInterval(vnode.state.intv);
      vnode.state.intv = setInterval(() => {
        --vnode.state.delay;
        if (vnode.state.delay <= 0) {
          clearInterval(vnode.state.intv);
          vnode.state.intv = null;
        }
        m.redraw();
      }, 1000);
    };
    vnode.state.startTimer();
  },
  onupdate: function (vnode) {
    if (vnode.state.currentQId !== vnode.attrs.qId) {
      vnode.state.currentQId = vnode.attrs.qId;
      vnode.state.delay = store.getState("hint-delay");
      vnode.state.startTimer();
    }
  },
  onremove: function (vnode) {
    if (vnode.state.intv) clearInterval(vnode.state.intv);
  },
  view: function (vnode) {
    const isRunning = vnode.state.delay > 0;
    return m("button.button.is-warning#hint-btn", {
      disabled: isRunning,
      onclick: () => {
        vnode.state.delay = store.setState("hint-delay", store.getState("hint-delay") + 3);
        vnode.state.startTimer();
        const toastText = `💡 Aff: ${curr.affirmative}\n💡 Neg: ${curr.negative}\n💡 Int: ${curr.interrogative}`;
        Toastify({ text: toastText, position: "center", style: { borderRadius: "12px", background: "#4a4a4a", color: "#fff", whiteSpace: "pre-line" } }).showToast();
      }
    }, isRunning ? `${vnode.state.delay}s` : m(I, "lightbulb"));
  }
};
const ChallengeForm = {
  save: function (ev, vnode) {
    let is_saveable = [curr.aff_sol, curr.neg_sol, curr.int_sol].map( a => (a || "").trim().length).reduce((a,b) => a+b, 0);
    if ( !is_saveable ) {
      return Toastify({ text: "☹️ Nothing to save!", position: "center", style: { background: "maroon", color: "#fff", borderRadius: "32px" } }).showToast();
    }
    let s = 0;
    s = isCorrect(curr.aff_sol, curr.affirmative)? (s + 1) : s
    s = isCorrect(curr.neg_sol, curr.negative)? (s + 1) : s
    s = isCorrect(curr.int_sol, curr.interrogative)? (s + 1) : s
    curr.score = s;
    curr.time_taken = (Model.started_at?(Date.now() - (Model.started_at || 0)):0) + (curr.time_taken || 0) 
    Model.put(curr).then(() => {
      Model.started_at = null;
      if (s == 3) {
        confetti({ position: { x: ev.clientX, y: ev.clientY } });
        let hint_delay = (store.getState( "hint-delay" ) || 0) - 1;
        store.setState("hint-delay", hint_delay<0?0:hint_delay);
      }
      Toastify({ text: "🎉 Great! Done in "+formatDuration(curr.time_taken)+" mins.", position: "center", style: { background: "teal", color: "#fff", borderRadius: "32px" } }).showToast();
      vnode.attrs.next();
      m.redraw();
      let sound = [SonicFX.error, SonicFX.warning, SonicFX.info, SonicFX.success]
      sound[s]();
    });
  },
  view: function (vnode) {
    const formula = getTenseFormula( Model.sanitizeChallengeName( vnode.attrs.name ) );
    var doc = nlp( curr.affirmative )
    let verb = doc.verbs().text()
    return m("#challenge-form.is-relative", m(".box", [
      curr.time_taken ? m(".tag.is-link#time-taken", "⏱️ " + formatDuration(curr.time_taken)) : curr.score ? m(".tag.is-danger", "Couldn't tracked time") : m("#anim-icons", 
      m("#anim-icons-wrapper", [..."⏳🙇⏰👀🥱👀⏰🙇⏳"].map( e => m("", e) ))),
      m("p.tag#qidx", (vnode.attrs.idx || 0) + 1),
      m("div#question.is-size-5", curr.hindi_sentence),
      m("div#help-tags.tags", [...new Set(doc.verbs().toInfinitive().out("array"))].map( v => m( "span.verbs.tag", v ) )),
    ]),
    m("div", [
      m("label.label", { "for": "aff-el" }, ["Affirmative", formula?m("div.tiny-text.has-text-info", " [ "+formula.affirmative+" ]"):null]),
      m("input[type=text]#aff-el.input[autocomplete=off]", {
        class: isCorrect( curr.aff_sol, curr.affirmative )? "is-success" : "",
        placeholder: "Write english translation",
        oninput: ev => curr.aff_sol = ev.target.value,
        value: curr.aff_sol
      }),
      m("label.label.mt-3", { "for": "neg-el" }, ["Negative", formula?m("div.tiny-text.has-text-info", " [ "+formula.negative+" ]"):null]),
      m("input[type=text]#neg-el.input[autocomplete=off]", {
        class: isCorrect(curr.neg_sol, curr.negative)? "is-success" : "",
        placeholder: "Write english translation",
        value: curr.neg_sol,
        oninput: ev => curr.neg_sol = ev.target.value
      }),
      m("label.label.mt-3", { "for": "int-el" }, ["Interrogative", formula?m("div.tiny-text.has-text-info", " [ "+formula.interrogative+" ]"):null]),
      m("input[type=text]#int-el.input[autocomplete=off]", {
        class: isCorrect(curr.int_sol, curr.interrogative)? "is-success" : "",
        placeholder: "Write english translation",
        value: curr.int_sol,
        oninput: ev => curr.int_sol = ev.target.value
      }),
      m(".is-flex.is-gap-1.mt-5#challenge-form-btns", [
        m("button.button.is-link.is-fullwidth", { onclick: ev => ChallengeForm.save(ev, vnode) }, m(I, "save")),
        m(Hint, { qId: curr.id })
      ])
    ]));
  }
}
const Challenge = {
  started_at: null,
  oninit: function (vnode) {
    vnode.state.idx = vnode.state.idx || Model.nextAvailableQuestion(vnode.attrs.name);
    vnode.state.qs = Model.getByChallenge(vnode.attrs.name)
    Model.started_at = Date.now()
    vnode.state.is_completed_shown = false;
  },
  onupdate: debounce((vnode) => {
    let test_meta = Model.meta().get(vnode.attrs.name);
    if( test_meta.score == (test_meta.count*3) && !vnode.state.is_completed_shown ) {
      vnode.state.is_completed_shown = true;
      AsyncPop.alert( `Completed in ~${formatDuration( test_meta.time_taken )}.`, "🎉 Congratulations" );
      for( let i = 0; i< 25;i++) {
        setTimeout( () => {
          confetti({ position: { x: window.innerWidth*Math.random(), y: window.innerHeight*Math.random() } })
          SonicFX.click();
        }, i*100);
      }
    }
  }, 100),
  view: function (vnode) {
    store.setState ( "active-challenge", vnode.attrs.name );
    try { curr = vnode.state.qs[vnode.state.idx] } catch (e) { console.log(e)}
    let next = () => {
      vnode.state.idx = ((vnode.state.idx + 1) >= vnode.state.qs.length) ? 0 : (vnode.state.idx + 1);
      Model.started_at = Date.now();
    }
    let pageButtons = getPaginationIndexes( vnode.state.idx, vnode.state.qs.length ).filter( i => i>=0 );
    pageButtons = pageButtons.map( pi => 
      m("li", m("button.is-relative", { "data-score":vnode.state.qs[pi].score, key: pi,
          onclick: () => { Model.started_at = Date.now(); vnode.state.idx = pi; },
          class: "pagination-link" + (vnode.state.idx == pi ? " is-current" : "")
        }, pi + 1)
      )
    );
    let test_meta = Model.meta().get(vnode.attrs.name);
    return m("#challenge.p-5.enter", { key: vnode.state.idx }, [
      m("nav.fixed-nav.fixed-nav--progress.p-4.box.is-radiusless", { "data-progress": Math.floor((test_meta.score/(test_meta.count*3))*100)+"%" },
        m(".is-flex.is-justify-content-space-between.is-align-items-center#challenge-form-nav", [
          m(ChallengeTitle, {name: vnode.attrs.name }),
          m(m.route.Link, { href: "/", class: "button is-small" }, m(I, "close")),
        ]),
      ),
      m(".section"),
      m(ChallengeStats, { meta: test_meta, name: vnode.attrs.name }),
      m("div.p-2"),
      m(ChallengeForm, { idx: vnode.state.idx, next: next, name: vnode.attrs.name }),
      vnode.state.show_full_pagination?
      m(".modal.is-active", [
        m(".modal-background"),
        m(".modal-content.p-5", m(".box", m("nav.pagination.is-rounded.is-small", m("ul.pagination-list.is-gap-1", 
          vnode.state.qs.map( (q,pi) => m("li", { class: AppConfigModel.is_completed_hidden && q.score == 3?"is-hidden":"" },
          m("button.is-relative.pagination-link", {
            "data-score": q.score,
            key: pi,
            onclick: () => {
              Model.started_at = Date.now();
              vnode.state.idx = pi;
              vnode.state.show_full_pagination = false;
            },
            class: (vnode.state.idx == pi ? " is-current" : "")
          }, pi + 1))
        )
        )))),
        m("button.modal-close.is-large", { "aria-label":"close", onclick: ev => { vnode.state.show_full_pagination = false; } })
      ]):null,
      m("nav.pagination.is-rounded.mt-5.is-small", [
        m("button.pagination-previous", {
          onclick: () => {
            vnode.state.idx = ((vnode.state.idx - 1) < 0) ? vnode.state.qs.length - 1 : (vnode.state.idx - 1);
            Model.started_at = Date.now();
            SonicFX.info();
          }
        }, m(I, "arrow_back")),
        m("button.pagination-next", {
          onclick: () => {
            vnode.state.idx = Model.getFirstTroubledQuestionIndex(vnode.attrs.name);
            Model.started_at = Date.now();
            SonicFX.info();
          }
        }, m(I, "recenter")),
        m("button.pagination-next", { onclick: () => { vnode.state.show_full_pagination = true; } }, m(I, "apps")),
        m("button.pagination-next", { onclick: () => { next(); SonicFX.info(); } }, m(I, "arrow_forward")),
        m("ul.pagination-list.is-gap-1", pageButtons)
      ])
    ]);
  }
}

const ChallengeTitle = {
  view: vnode => {
    return m(".is-flex.is-gap-1.is-align-items-center.challenge-title", [
      m(".avatar.p-2.is-bordered", getEmoji(vnode.attrs.name)),
      m(".is-size-6", Model.sanitizeChallengeName(vnode.attrs.name).replace("CUSTOM-","")),
    ])
  }
}

let curr = {}
const StatCard = {
  view: vnode => {
    return m(".has-text-centered.info-card."+vnode.attrs.subtitle.replaceAll(/\s+/gi,"-").toLowerCase(), [
      m("p", vnode.attrs.title),
      m("strong.is-size-7.has-text-bold", vnode.attrs.subtitle),
    ]);
  }
}
const ChallengeStats = {
  view: vnode => {
    let meta = vnode.attrs.meta;
    let k = vnode.attrs.name;
    return m(".fixed-grid.has-3-cols.my-4", m(".grid", [
      m(".cell.p-2.is-bordered.rounded-border.info-card-wrapper.is-relative.is-clipped", {"data-progress": (Math.ceil((meta.touched/meta.count)*100)+"%")},m(StatCard, { title: meta.touched + "/" + meta.count, subtitle: "Attempted"})),
      m(".cell.p-2.is-bordered.rounded-border.info-card-wrapper.is-relative.is-clipped", {"data-progress": (Math.ceil((meta.score/(meta.count*3))*100)+"%")},m(StatCard, {title: meta.score + "/" + meta.count*3, subtitle: "Score"})),
      m(".cell.p-2.is-bordered.rounded-border.info-card-wrapper.is-relative.is-clipped", {"data-progress": (Math.ceil((meta.time_taken/Math.max(meta.time_taken, meta.count*3*10*1000))*100)+"%")},m(StatCard, {title: formatDuration(meta.time_taken), subtitle: "Time"}))
    ]))
  }
}
const ChallengeCard = {
  view: function(vnode) {
    let meta = Model.meta();
    let k = vnode.attrs.name;
    let is_active_challenge = vnode.attrs.is_active_challenge;
    if ( !meta.get( k ) ) return null;
    let is_completed = meta.get(k).score == meta.get(k).count * 3;
    if (store.getState("is-completed-hidden") && is_completed ) return null;
    return m(".cell.enter", {key: k},
      m("div.challenge-card-wrapper", {class: (is_active_challenge?"active-challenge-wrapper":"") }, [
        m("input[type=checkbox].selector", {key: k, "data-name": k}),
        m(m.route.Link, { href: `challenge/${k}`, class: "box challenge-card" + (is_active_challenge?" active-challenge":""), key: k }, [
          m( ChallengeTitle, { name: k }),
          m(ChallengeStats, { meta: meta.get(k), name: k }),
          m(".is-flex.is-justify-content-space-between.is-align-items-center", [
            is_completed?m(".tag.challenge-status", [m(I, "done_all"), m("span.ml-2", "Completed")]):null,
            meta.get(k).touched?null:m(".tag.challenge-status", [m(I, "lock"), m("span.ml-2", "Not Started")]),
            (meta.get(k).touched && !is_completed)?m(".tag.challenge-status", [m(I, "footprint"), m("span.ml-2", "In Progress")]):null
          ])
        ])
      ])
    );
  }
}
const ChallengeByTab = {
  view: function (vnode) {
    let meta = Model.meta();
    let names = Array.from(Model.meta().keys());
    if (vnode.attrs.tab.toLowerCase() != "all")
      names = names.filter(k => Model.sanitizeChallengeName( k ).toLowerCase().startsWith(vnode.attrs.tab.toLowerCase()) );
    if ( store.getState( "is-completed-hidden" ) )
      names = names.filter( k => meta.get(k).score != meta.get(k).count*3)
    let els = names.map((n, i) => m(ChallengeCard, { name: n }));
    return m(".mt-5", { key: vnode.attrs.tab }, [
      m(".grid.is-col-min-10.is-gap-4", els.length?els:m(".notification.has-text-success.enter.has-text-centered.has-text-weight-bold.title", "🥳 All Sorted!"))
    ]);
  }
}
const ScoreCard = {
  view: function (vnode) {
    let fillState = function (m) {
      vnode.state.qcount = m.reduce((acm, c) => acm + c.count, 0);
      vnode.state.qscore = m.reduce((acm, c) => acm + c.score, 0);
      vnode.state.qtouched = m.reduce((acm, c) => acm + c.touched, 0);
    }
    if (!Model.size()) {
      Model.load().then(() => {
        fillState(Array.from(Model.meta().values()));
        m.redraw();
      });
    } else {
      fillState(Array.from(Model.meta().values()))
      m.redraw();
    }
    return m(".columns", [
      m(".column",
        m('.notification.is-primary.has-text-black.bg-icon.total-attempted', m(".is-flex.is-justify-content-space-between.is-align-items-center",[
          m("", [
            m("p", m("strong.is-size-7", "Translation Mastery") ),
            m("span.title", vnode.state.qtouched),
            m("span.is-size-6", "/" + vnode.state.qcount),
            m("p.is-size-7", "Completed Sentences")
          ]),
          m(".circle-score.is-flex.is-justify-content-center.is-align-items-center", Math.floor((vnode.state.qtouched/vnode.state.qcount)*100)+"%"),
        ]))
      ),
      m(".column",
        m('.notification.is-warning.has-text-black.bg-icon.total-score', m(".is-flex.is-justify-content-space-between.is-align-items-center",[
          m("", [
            m("p", m("strong.is-size-7", "Total Score") ),
            m("span.title", vnode.state.qscore),
            m("span.is-size-6", "/" + vnode.state.qcount*3),
            m("p.is-size-7", "Lifetime Marks Earned")
          ]),
          m(".circle-score.is-flex.is-justify-content-center.is-align-items-center", Math.floor((vnode.state.qscore/(vnode.state.qcount*3))*100)+"%"),
        ]))
      ),
    ])
  }
}
const Challenges = {
  view: function (vnode) {
    let meta = Model.meta();
    let nat = store.getState("active-challenge") || Model.nextAvailableChallenge();
    if ( nat && (meta.get( nat ).score == (meta.get( nat ).count*3)) )
      nat = Model.nextAvailableChallenge();
    return m("#challenges.p-5.enter", [
      m("nav.fixed-nav.p-4.box.is-radiusless", 
        m(".is-flex.is-justify-content-center", [
          m(".is-size-5", [m("span.has-text-info", getEmoji("LingoQuest")), m("span", " | "),m("span.has-text-gray", "Lingo"),m("span.has-text-danger.has-text-weight-bold", "Quest")])
        ]),
      ),
      m(".section"),
      m(ScoreCard),
      nat?m(".grid", m(ChallengeCard, {name: nat, is_active_challenge: true}) ):m("p.notification.is-success", "🎉 All done!"),
      m(".tabs.is-boxed.is-small", [
        m("ul", [
          {v:"All",e:"🌐"},
          {v:"Present", e:"⏳"},
          {v:"Past", e:"📜"},
          {v:"Future", e:"🚀"},
          {v:"Custom",e:"🛠️"}
        ].map(t => m("li", { key: AppConfigModel.last_selected_tab, class: AppConfigModel.last_selected_tab.toLowerCase() == t.v.toLowerCase()?"is-active":"" },
          m("a", {onclick: () => AppConfigModel.setLastSelectedTab( t.v ) }, m("p", t.e +" "+ t.v)) )
        ))
      ]),
      m(ChallengeByTab, { tab: AppConfigModel.last_selected_tab }),
      m(FooterControl)
    ]);
  }
}

Model.load().then( () => {
  m.route(document.getElementById("root"), "/", {
    "/": Loading,
    "/challenges": { render: (vnode) => m(Layout, m(Challenges)) },
    "/challenge": { render: (vnode) => m(Layout, m(Challenge)) },
    "/challenge/:name": { render: (vnode) => m(Layout, m(Challenge, vnode.attrs)) },
  })
});