const home = require('./controllers/home');
const firebase = require('./firebase');
const filter = require('./controllers/filter');
const { type } = require('express/lib/response');
const errorMsg = require('./controllers/errorMsg');
const editFlag = require('./controllers/editor');
const times = require('./controllers/time');
const areaCities = require('./controllers/areaCities');
const dateTime = require('./controllers/date');
const providerRef = require('./controllers/providerRef');
const { async } = require('@firebase/util');


module.exports = function (app) {

  // index page
  app.get('/', function (req, res) {
    editFlag.editFalse();
    res.render('pages/index', {
      ourStars: home.ourStars,
      firebase: firebase
    });
  });

  // contact page
  app.get('/contact', async function (req, res) {
    editFlag.editFalse();
    res.render('pages/contact', {
      firebase: firebase
    });
  });

  // portal page
  app.get('/portal', async function (req, res) {
	  
    editFlag.editFalse();
    var userData = await firebase.CurrentUserData()
    const time = times.time
    const areas = areaCities.area
    const cities = areaCities.city
    if (filter.flag) {
      var providers = await filter.providers
    } else {
      var providers = filter.result
      filter.flag = true
    }
    res.render('pages/portal', {
	  providerRef,
	  time: dateTime,
      providers: providers,
      userData: userData,
      times: time,
      areas: areas,
      cities: cities
    });
  });

  // login-signup page
  app.get('/login', function (req, res) {
    res.render('pages/login');
  });

  // enter-personal-info page - client
  app.get('/enter_personal_c', async function (req, res) {
    const userData = await firebase.CurrentUserData()
    res.render('pages/enter_personal_c', {
      fullname: userData.fullname,
      email: firebase.auth._currentUser.email,
      phonenumber: userData.phonenumber,
      errorMsg: errorMsg
    });
  });

  // enter-personal-info page - provider
  app.get('/enter_personal_p', async function (req, res) {
    const userData = await firebase.CurrentUserData()
    res.render('pages/enter_personal_p', {
      fullname: userData.fullname,
      email: firebase.auth._currentUser.email,
      phonenumber: userData.phonenumber,
      errorMsg: errorMsg
    });
  });

  /**
   * Forms submit endpoitns
   */
  app.post('/authenticate', function (req, res) {
    const { email, password } = req.body;
    firebase.authenticate(email, password, () => {
      res.redirect('/portal');
    })
  });

  app.post('/signup', function (req, res) {

    const { email, password, fullname, phone, type } = req.body;

    firebase.signup(email, password, fullname, phone, type, () => {
      if (type == 1) {
        res.redirect('/enter_personal_p');
      } else {
        res.redirect('/enter_personal_c');
      }
      // res.redirect('/portal');
    })
  });

  app.post('/logout', function (req, res) {
    //const { email } = req.body;
    firebase.logout(() => {
      res.redirect('/');
    })
  });


  // 1.here I will update what the user has entered in personal info page after sign-up 

  //1.1 provider page
  app.post('/personalInfo_provider', function (req, res) {
    var { age, area_city, price, typeP, typeS, about_me } = req.body;
    console.log(req.body)

    // if the user didnt fill the minimum reqiure fields
    if (typeS == null || typeP == null || area_city == null) {
      errorMsg.flag = true
      res.redirect('/enter_personal_p')
    }
    // adding the user input to the DB
    else {

      // converting variables data type to array with string
      let type_of_pet = filter.toArray(typeP)
      let type_of_service = filter.toArray(typeS)
      area_city = filter.toArray(area_city)

      firebase.UpdateDocProvider(parseInt(age), area_city, parseInt(price), type_of_service, type_of_pet, about_me, () => {
        res.redirect('/portal');
      })
    }
  });

  //1.2 client page
  app.post('/personalInfo_client', function (req, res) {
    const { age, address, about_me } = req.body;
    console.log(req.body)

    // if the user didnt fill the minimum reqiure fields
    if (address == '') {
      errorMsg.flag = true
      res.redirect('/enter_personal_c')
    }
    // adding the user input to the DB
    else {
      firebase.UpdateDocClient(parseInt(age), address, about_me, () => {
        res.redirect('/portal');
      })
    }

  })


  app.post('/filtering', function (req, res) {
    var { area_city, price, typeP, typeS, date, from, to } = req.body;
	dateTime.date = date;
	dateTime.from = from;
	dateTime.to = to;
    //javascript cannot return multiple values, needed to return array with the multiple values
    var values = filter.fixParams(area_city, typeP, typeS)
    let ar = values[0];
    let type_of_pet = values[1];
    let type_of_service = values[2];

    filter.changeProvider(ar, parseInt(price), type_of_pet, type_of_service, () => {
      res.redirect("/portal") 
    })

  });

  /////////////////////////////////////////////////////////////////////////////////////////////////coral
  // edit-personal-info-provider page - provider
  app.get('/myPersonalInfo', async function (req, res) {
    const areas = areaCities.area
    const cities = areaCities.city
    const userData = await firebase.CurrentUserData()
    //console.log('at myPersonalInfo_p', userData)
    if (userData.typeOfUser == 1) {
      res.render('pages/myPersonalInfo_p', {
		userData,
        fullname: userData.fullname,
        email: firebase.auth._currentUser.email,
        phonenumber: userData.phonenumber,
        age: userData.age,
        price: userData.price_per_hour,
        area_city: userData.area_city,
        type_of_pet: userData.type_of_pet,
        type_of_service: userData.type_of_service,
        about_me: userData.about_me,
        errorMsg: errorMsg,
        editFlag: editFlag,
        areas: areas,
        cities: cities
      });
    }
    else {
      res.render('pages/myPersonalInfo_c', {
		userData,
        fullname: userData.fullname,
        email: firebase.auth._currentUser.email,
        phonenumber: userData.phonenumber,
        age: userData.age,
        address: userData.address,
        about_me: userData.about_me,
        errorMsg: errorMsg,
        editFlag: editFlag,
        areas: areas,
        cities: cities

      });
    }
  });

	//change for client and for provider
	// schedule page - provider
	app.get('/mySchedule', async function (req, res) {
		editFlag.editFalse();
		const userData = await firebase.CurrentUserData()
		const time = times.time;
		const freeTime = userData.freeTime || [];
		const reservations = userData.reservations || [];
		if (userData.typeOfUser == 1) {
			res.render('pages/myScheduleP', {
			userData,
			fullname: userData.fullname,
			email: firebase.auth._currentUser.email,
			phonenumber: userData.phonenumber,
			errorMsg: errorMsg,
			times: time,
			freeTime,
			reservations
			});
		}
		else {
			res.render('pages/myScheduleC', {
			userData,
			fullname: userData.fullname,
			email: firebase.auth._currentUser.email,
			phonenumber: userData.phonenumber,
			errorMsg: errorMsg,
			times: time,
			userData,
			reservations
			});
		}
	});

  //same page for client and provider
  // setting page - provider
  app.get('/mySetting', async function (req, res) {
    editFlag.editFalse();
    const userData = await firebase.CurrentUserData()
    console.log('at mySetting', userData)
    res.render('pages/mySetting', {
	  userData,
      fullname: userData.fullname,
      email: firebase.auth._currentUser.email,
      phonenumber: userData.phonenumber,
      errorMsg: errorMsg
    });
  });

  app.post('/myProfile', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    const type = userData.typeOfUser;
    res.redirect('/myPersonalInfo');



  });

  app.post('/home', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    if (userData != null) {
      res.redirect('/portal');
    } else {
      res.redirect('/');
    }

  });


  app.post('/mySchedule', async function (req, res) {
    //schedule.calendar.render();
    res.redirect("/mySchedule")
  });

  app.post('/mySetting', async function (req, res) {
    res.redirect("/mySetting")

  });


  app.post('/changePassword', async function (req, res) {
    const { cpassword, npassword } = req.body;
    firebase.changePassword(cpassword, npassword)
    res.redirect("/mySetting")

  });
  app.post('/deleteAccount', async function (req, res) {
    firebase.deleteAccount()
    res.redirect("/")

  });
  //update provider document
  app.post('/updateP', async function (req, res) {
    var { age, price, area_city, typeP, typeS, about_me } = req.body;
    const userData = await firebase.CurrentUserData()


    age = (age == '') ? userData.age : age;
    price = (price == null) ? userData.price : price;
    if (area_city == null) {
      area_city = userData.area_city;
    }
    if (typeP == null) {
      typeP = userData.type_of_pet
    }
    if (typeS == null) {
      typeS = userData.type_of_service
    }

    about_me = (about_me == '') ? userData.about_me : about_me;

    let type_of_pet = filter.toArray(typeP)
    let type_of_service = filter.toArray(typeS)
    area_city = filter.toArray(area_city)
    editFlag.editFalse()

    firebase.UpdateDocProvider(parseInt(age), area_city, parseInt(price), type_of_pet, type_of_service, about_me, () => {
      res.redirect("/myPersonalInfo")
    })

  });
  //update client document
  app.post('/updateC', async function (req, res) {
    var { age, address, about_me } = req.body;
    const userData = await firebase.CurrentUserData()
    age = (age == '') ? userData.age : age;
    address = (address == '') ? userData.address : address;
    about_me = (about_me == '') ? userData.about_me : about_me;

    editFlag.editFalse()
    firebase.UpdateDocClient(parseInt(age), address, about_me, () => {
      res.redirect("/myPersonalInfo")
    })

  });
  //cancel button
  app.post('/cancel', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    editFlag.editFalse()
    res.redirect("/myPersonalInfo")

  });

  //edit button
  app.post('/edit', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    editFlag.editTrue()
    res.redirect("/myPersonalInfo")

  });
  //add free time 
  app.post('/addFreeTime', async function (req, res) {
    const { date, from, to } = req.body
    firebase.addFreeTime(date, from, to, () => {
      res.redirect('/mySchedule');
    })

  });

  //forgot password 
  app.post('/forgotPassword', async function (req, res) {
    const { email } = req.body
    firebase.sendEmail(email, () => {
      res.redirect('/login');
    })

  });

	//add reservation to the documents
	app.post('/addReservation', function (req, res) {
		console.log(providerRef.index)
		firebase.addReservation(dateTime.date, dateTime.from, dateTime.to, providerRef, () => {
			res.redirect('/portal')
		})

	});

  //add contact message to a documents
  app.post('/contact', async function (req, res) {
    const { name, emailSender, message } = req.body;

    if (firebase.auth._currentUser == null) {
      firebase.addContactMsg(name, emailSender, message, () => {
        res.redirect('/contact');
      });
    }
    else {
      const userData = await firebase.CurrentUserData();
      if (emailSender == userData.email) {
        firebase.addContactMsg(name, emailSender, message_text, () => {
          res.redirect('/contact');
        });
      }
      else {
        console.log("the email is not match to the current user email")
        res.redirect('/contact');
      }
    }
  });

}
