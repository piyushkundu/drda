const fs = require('fs');

const raw = `14,UP-VRP-45009,AMARDEEP,Male,Secondary(upto 1oth std),BAGHPAT,9719391531,-,-,Working,Verified,Edit
102,UP-VRP-26703,Anil Kumar,Male,Secondary(upto 1oth std),BAGHPAT,7533932488,-,-,Working,Verified,Edit
87,UP-VRP-26721,ANITA,Female,Primary(upto 5th std),BAGHPAT,7983174889,-,-,Discontinued,Not Verified,Edit
122,UP-VRP-21266,Anju tyagi,Female,Secondary(upto 1oth std),BAGHPAT,9536344417,,-,Working,Verified,Edit
55,UP-VRP-37019,Annu,Female,Secondary(upto 1oth std),BAGHPAT,7017136184,Annu1982@gmail.com,-,Working,Verified,Edit
7,UP-VRP-45063,ANUJ KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,8178603321,-,-,Working,Verified,Edit
70,UP-VRP-32017,Anurag Bhardwaj,Male,Secondary(upto 1oth std),BAGHPAT,9811084457,anurag@123gmail.com,-,Working,Verified,Edit
99,UP-VRP-26706,ARUN KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,7055028645,-,-,Working,Verified,Edit
84,UP-VRP-26862,Arvind kumar,Male,Secondary(upto 1oth std),BAGHPAT,9627629543,-,-,Working,Verified,Edit
6,UP-VRP-45075,ASHEESH DHAKA,Male,Secondary(upto 1oth std),BAGHPAT,7409250104,-,-,Working,Verified,Edit
15,UP-VRP-44600,BABITA,Female,Secondary(upto 1oth std),BAGHPAT,8979262126,-,-,Working,Verified,Edit
92,UP-VRP-26716,BABLI SHARMA,Female,Secondary(upto 1oth std),BAGHPAT,9997624355,-,-,Working,Verified,Edit
124,UP-VRP-21264,Bhrampal,Male,Primary(upto 5th std),BAGHPAT,8755061146,-,-,Working,Not Verified,Edit
1,UP-VRP-46188,bijendra,Male,Secondary(upto 1oth std),BAGHPAT,8126773155,-,-,Working,Verified,Edit
111,UP-VRP-26628,Bijendra,Male,Secondary(upto 1oth std),BAGHPAT,8171922421,-,-,Working,Not Verified,Edit
125,UP-VRP-21260,Bijendra,Male,Senior Secondary(upto 12th std),BAGHPAT,9758469429,,-,Working,Verified,Edit
79,UP-VRP-28235,Bimlesh,Female,Primary(upto 5th std),BAGHPAT,8534826015,-,-,Working,Verified,Edit
5,UP-VRP-45084,BITTU RAM,Male,Secondary(upto 1oth std),BAGHPAT,9997388970,-,-,Working,Verified,Edit
59,UP-VRP-37015,Dariyav Singh,Male,Graduate,BAGHPAT,9557417550,Dariyav@gmail.com,-,Working,Verified,Edit
74,UP-VRP-31856,Davender,Male,Primary(upto 5th std),BAGHPAT,6397978652,Davender123@gmail.com,-,Working,Not Verified,Edit
64,UP-VRP-33028,davendr,Male,Secondary(upto 1oth std),BAGHPAT,9058913597,sumitkumar98182@gmail.com,-,Working,Not Verified,Edit
91,UP-VRP-26717,DAYANAND,Male,Secondary(upto 1oth std),BAGHPAT,8222050939,-,-,Working,Verified,Edit
12,UP-VRP-45021,DEEPALI RANI,Female,Secondary(upto 1oth std),BAGHPAT,9368690235,-,-,Working,Verified,Edit
104,UP-VRP-26690,dhankesh sharma,Male,Senior Secondary(upto 12th std),BAGHPAT,9760790022,-,-,Working,Verified,Edit
89,UP-VRP-26719,dharamkumar,Male,Secondary(upto 1oth std),BAGHPAT,8979816474,-,-,Working,Verified,Edit
131,UP-VRP-21122,GaJendra Dhama,Male,Senior Secondary(upto 12th std),BAGHPAT,7906779126,-,-,Working,Verified,Edit
48,UP-VRP-37859,Harendra,Male,Senior Secondary(upto 12th std),BAGHPAT,9634011551,Harendra1976@gmail.com,-,Working,Verified,Edit
65,UP-VRP-33026,IQBAL SINGH,Male,Secondary(upto 1oth std),BAGHPAT,8266086292,aksaytyagi703@gmail.com,-,Working,Verified,Edit
2,UP-VRP-46183,jashbir singh,Male,Secondary(upto 1oth std),BAGHPAT,8077520008,-,-,Working,Verified,Edit
94,UP-VRP-26712,jaymala,Male,Senior Secondary(upto 12th std),BAGHPAT,9411980119,-,-,Working,Not Verified,Edit
95,UP-VRP-26711,jitendra kumar,Male,Secondary(upto 1oth std),BAGHPAT,9068932119,-,-,Working,Verified,Edit
76,UP-VRP-28238,KAMLESH,Female,Secondary(upto 1oth std),BAGHPAT,9808921164,sahanirajk@gmail.com,-,Working,Verified,Edit
132,UP-VRP-21121,Kamlesh,Female,Primary(upto 5th std),BAGHPAT,9389208377,-,-,Working,Not Verified,Edit
45,UP-VRP-37961,Kapil,Male,Senior Secondary(upto 12th std),BAGHPAT,9897026276,kapilbhardwaj@gmail.com,-,Working,Verified,Edit
9,UP-VRP-45046,KAPIL DEV SHARMA,Male,Primary(upto 5th std),BAGHPAT,9627254000,-,-,Working,Verified,Edit
31,UP-VRP-44499,KAPIL TOMAR,Male,Secondary(upto 1oth std),BAGHPAT,9012551575,-,-,Working,Verified,Edit
119,UP-VRP-26377,Karan Singh,Male,Secondary(upto 1oth std),BAGHPAT,9719678990,-,-,Working,Not Verified,Edit
47,UP-VRP-37866,Karuna,Female,Secondary(upto 1oth std),BAGHPAT,8923396590,Karuna1970@gmail.com,-,Working,Verified,Edit
133,UP-VRP-21053,KASHMIRE,Male,Secondary(upto 1oth std),BAGHPAT,9639757127,-,-,Working,Verified,Edit
11,UP-VRP-45032,KAVITA,Female,Secondary(upto 1oth std),BAGHPAT,8923046436,-,-,Working,Verified,Edit
90,UP-VRP-26718,KAVITA,Female,Senior Secondary(upto 12th std),BAGHPAT,8630272323,-,-,Working,Verified,Edit
116,UP-VRP-26385,Kavita,Female,Secondary(upto 1oth std),BAGHPAT,8445628524,-,-,Working,Not Verified,Edit
63,UP-VRP-35640,Kawarpal Singh,Male,Senior Secondary(upto 12th std),BAGHPAT,7906741948,pkarya@gmail.com,-,Working,Verified,Edit
46,UP-VRP-37958,Kirender pal Singh,Male,Senior Secondary(upto 12th std),BAGHPAT,7500167206,kirendrasingh@gmail.com,-,Working,Verified,Edit
112,UP-VRP-26627,Krishanpal,Male,Secondary(upto 1oth std),BAGHPAT,9759341611,-,-,Working,Verified,Edit
43,UP-VRP-38155,Kuldeep kumar,Male,Senior Secondary(upto 12th std),BAGHPAT,8533014592,kuldeep@gmail.com,-,Working,Not Verified,Edit
27,UP-VRP-44518,LALIT KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,7599474795,-,-,Working,Verified,Edit
108,UP-VRP-26683,Laxman,Male,Senior Secondary(upto 12th std),BAGHPAT,8006657377,-,-,Working,Verified,Edit
54,UP-VRP-37020,Madan pal,Male,Senior Secondary(upto 12th std),BAGHPAT,9837663749,Madanpal1968@gmail.com,-,Working,Verified,Edit
51,UP-VRP-37023,Maganvir Singh Dhaka,Male,Senior Secondary(upto 12th std),BAGHPAT,9675062578,Maganvir1973@gmail.com,-,Working,Not Verified,Edit
39,UP-VRP-38930,Manju,Female,Secondary(upto 1oth std),BAGHPAT,9634247814,manju444@gmail.com,-,Working,Verified,Edit
123,UP-VRP-21265,Manju,Female,Senior Secondary(upto 12th std),BAGHPAT,9761487334,,-,Working,Verified,Edit
16,UP-VRP-44576,MANOJ KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,9012543988,-,-,Working,Verified,Edit
103,UP-VRP-26692,Manoj kumar,Male,Secondary(upto 1oth std),BAGHPAT,7409815717,-,-,Working,Verified,Edit
114,UP-VRP-26609,Manoj Kumar,Male,Senior Secondary(upto 12th std),BAGHPAT,6398100803,-,-,Working,Not Verified,Edit
10,UP-VRP-45038,MINAKSHI,Female,Secondary(upto 1oth std),BAGHPAT,9634281426,-,-,Working,Verified,Edit
105,UP-VRP-26686,Mukesh Kumar,Male,Graduate,BAGHPAT,8077553432,-,-,Working,Verified,Edit
82,UP-VRP-28222,Narender Kumar,Male,Primary(upto 5th std),BAGHPAT,9536344418,,-,Working,Verified,Edit
62,UP-VRP-35641,Naresh,Male,Primary(upto 5th std),BAGHPAT,8979445128,Naresh@gamil.com,-,Working,Not Verified,Edit
44,UP-VRP-38140,Neelam Devi,Female,Secondary(upto 1oth std),BAGHPAT,7500877871,nilamdevi@gmail.com,-,Working,Verified,Edit
52,UP-VRP-37022,Neeraj,Female,Senior Secondary(upto 12th std),BAGHPAT,9058551172,Neeraj1980@gmail.com,-,Working,Verified,Edit
29,UP-VRP-44510,NEERAJ DEVI,Female,Secondary(upto 1oth std),BAGHPAT,9548918248,-,-,Working,Verified,Edit
28,UP-VRP-44514,NIKKI,Female,Secondary(upto 1oth std),BAGHPAT,9720719843,-,-,Working,Verified,Edit
49,UP-VRP-37854,Nirmala,Female,Senior Secondary(upto 12th std),BAGHPAT,7017438864,nirmala1981@gmail.com,-,Working,Verified,Edit
17,UP-VRP-44567,NITIN KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,8826279698,-,-,Working,Verified,Edit
77,UP-VRP-28237,Om kali,Female,Primary(upto 5th std),BAGHPAT,8057544687,writepriyanka@gmail.com,-,Working,Verified,Edit
96,UP-VRP-26710,pawan sharma,Male,Secondary(upto 1oth std),BAGHPAT,9897985142,-,-,Working,Verified,Edit
8,UP-VRP-45058,PINKI,Female,Graduate,BAGHPAT,9760741693,-,-,Working,Verified,Edit
80,UP-VRP-28227,poonam,Female,Secondary(upto 1oth std),BAGHPAT,9368415540,,-,Working,Verified,Edit
19,UP-VRP-44552,POONAM SHARMA,Female,Secondary(upto 1oth std),BAGHPAT,9897691664,-,-,Working,Verified,Edit
109,UP-VRP-26630,pradeep kumar,Male,Primary(upto 5th std),BAGHPAT,8868872568,-,-,Working,Verified,Edit
40,UP-VRP-38925,Praveen Kumar,Male,Senior Secondary(upto 12th std),BAGHPAT,9719113693,praveenkumar222@gmail.com,-,Working,Verified,Edit
30,UP-VRP-44506,PRAVITA,Female,Secondary(upto 1oth std),BAGHPAT,8923797266,-,-,Working,Verified,Edit
126,UP-VRP-21259,Punam,Female,Secondary(upto 1oth std),BAGHPAT,8077300873,Punambag@gmail.com,-,Working,Not Verified,Edit
42,UP-VRP-38430,Puspendra,Male,Senior Secondary(upto 12th std),BAGHPAT,7452067424,puspendra111@gmail.com,-,Working,Not Verified,Edit
106,UP-VRP-26685,Rachana,Male,Secondary(upto 1oth std),BAGHPAT,7906448077,-,-,Working,Not Verified,Edit
75,UP-VRP-28492,raj kumar,Male,Graduate,BAGHPAT,9927242513,gejasingh0691@gmail.com,-,Working,Verified,Edit
134,UP-VRP-21049,Raj kumar,Male,Senior Secondary(upto 12th std),BAGHPAT,9760732189,-,-,Working,Verified,Edit
85,UP-VRP-26723,RAJENDRA SINGH CHAUHAN,Male,Secondary(upto 1oth std),BAGHPAT,9761466719,-,-,Working,Verified,Edit
36,UP-VRP-41823,rajesh kumar,Male,Senior Secondary(upto 12th std),BAGHPAT,9760033136,-,-,Working,Verified,Edit
115,UP-VRP-26595,Rajiv Kumar,Male,Secondary(upto 1oth std),BAGHPAT,9675636161,-,-,Working,Not Verified,Edit
100,UP-VRP-26705,Rakhi Sharma,Female,Graduate,BAGHPAT,9358624246,-,-,Working,Not Verified,Edit
34,UP-VRP-41830,Rakhi Shrma,Female,Secondary(upto 1oth std),BAGHPAT,9520294933,-,-,Working,Verified,Edit
117,UP-VRP-26384,Ramniwas,Male,Graduate,BAGHPAT,9897960841,-,-,Working,Not Verified,Edit
130,UP-VRP-21123,Rampal Singh,Male,Senior Secondary(upto 12th std),BAGHPAT,7060673225,-,-,Working,Not Verified,Edit
113,UP-VRP-26626,Ranveer,Male,Senior Secondary(upto 12th std),BAGHPAT,9675454329,-,-,Working,Verified,Edit
18,UP-VRP-44556,RAVI KUMAR TOMAR,Male,Secondary(upto 1oth std),BAGHPAT,9548988505,-,-,Working,Verified,Edit
60,UP-VRP-37014,Rohotash Singh,Male,Senior Secondary(upto 12th std),BAGHPAT,8755363651,Rohotash@gmail.com,-,Working,Verified,Edit
69,UP-VRP-32018,roki kashyap,Male,Senior Secondary(upto 12th std),BAGHPAT,9012033202,rokikashyap@gmail.com,-,Working,Verified,Edit
35,UP-VRP-41825,SAHDEV Singh ARYA,Male,Senior Secondary(upto 12th std),BAGHPAT,6396478454,-,-,Working,Verified,Edit
88,UP-VRP-26720,SANJAY DHAMA,Male,Graduate,BAGHPAT,9756303244,-,-,Working,Not Verified,Edit
127,UP-VRP-21233,Sanjeev Kumar,Male,Secondary(upto 1oth std),BAGHPAT,8393066572,-,-,Working,Not Verified,Edit
50,UP-VRP-37024,Sanjeev Kumar Dhaka,Male,Senior Secondary(upto 12th std),BAGHPAT,9627179366,Sanjeva1972@gmail.com,-,Working,Not Verified,Edit
98,UP-VRP-26707,sanjiv kumar,Male,Secondary(upto 1oth std),BAGHPAT,8869092982,-,-,Working,Not Verified,Edit
101,UP-VRP-26704,Satender Kumar,Male,Secondary(upto 1oth std),BAGHPAT,9837277517,-,-,Working,Not Verified,Edit
97,UP-VRP-26708,satendra kumar nain,Male,Secondary(upto 1oth std),BAGHPAT,8445047834,-,-,Working,Verified,Edit
24,UP-VRP-44525,SATENDRA SINGH,Male,Secondary(upto 1oth std),BAGHPAT,7895960603,-,-,Working,Verified,Edit
73,UP-VRP-31863,Satish kumar,Male,Secondary(upto 1oth std),BAGHPAT,9761151213,satish@123gmail.com,-,Working,Not Verified,Edit
66,UP-VRP-33006,satish kumar sharma,Male,Secondary(upto 1oth std),BAGHPAT,7456076264,manojsharma020171@gmail.com,-,Working,Verified,Edit
135,UP-VRP-5649,Satishchandra,Male,Primary(upto 5th std),BAGHPAT,9198948203,-,1974-07-12,Working,Not Verified,Edit
72,UP-VRP-31884,Satyadev Singh,Male,Graduate,BAGHPAT,9548186327,satyadev@gmail.com,-,Working,Not Verified,Edit
37,UP-VRP-38932,Savita,Female,Secondary(upto 1oth std),BAGHPAT,6395579071,savita4444@gmail.com,-,Working,Not Verified,Edit
57,UP-VRP-37017,Shalu,Female,Secondary(upto 1oth std),BAGHPAT,7895493312,Shalu1989@gmail.com,-,Working,Verified,Edit
58,UP-VRP-37016,Shiv Kumar,Male,Secondary(upto 1oth std),BAGHPAT,9639151684,Shiv1968@gmail.com,-,Working,Verified,Edit
71,UP-VRP-31959,Shripal singh,Male,Secondary(upto 1oth std),BAGHPAT,8171572225,Shripal@123gmail.com,-,Working,Verified,Edit
67,UP-VRP-32997,shrpal singh,Male,Secondary(upto 1oth std),BAGHPAT,9557241377,akhilesharma.c402@gmail.com,-,Working,Not Verified,Edit
38,UP-VRP-38931,Sompal Singh,Male,Senior Secondary(upto 12th std),BAGHPAT,9568376196,sompalsingh222@gmail.com,-,Working,Verified,Edit
53,UP-VRP-37021,Sonika,Female,Secondary(upto 1oth std),BAGHPAT,6395773604,Sonika1982@gmail.com,-,Working,Verified,Edit
13,UP-VRP-45014,SONU KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,7683026224,-,-,Working,Verified,Edit
107,UP-VRP-26684,Subhash chand,Male,Senior Secondary(upto 12th std),BAGHPAT,9410814975,-,-,Working,Verified,Edit
33,UP-VRP-43845,sudesh chauhan,Female,Secondary(upto 1oth std),BAGHPAT,8057991090,-,-,Working,Verified,Edit
93,UP-VRP-26715,sudhir KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,9897006306,-,-,Working,Verified,Edit
120,UP-VRP-26376,Sukhdev Singh,Male,Post Graduate,BAGHPAT,8273378396,-,-,Working,Verified,Edit
26,UP-VRP-44520,SUMAN DEVI,Female,Secondary(upto 1oth std),BAGHPAT,8923804622,-,-,Working,Verified,Edit
56,UP-VRP-37018,Suman Devi,Female,Secondary(upto 1oth std),BAGHPAT,9557419341,Suman1978@gmail.com,-,Working,Verified,Edit
25,UP-VRP-44522,SUMIT,Male,Secondary(upto 1oth std),BAGHPAT,8194081937,-,-,Working,Verified,Edit
4,UP-VRP-45091,SUMIT KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,7060811600,-,-,Working,Verified,Edit
118,UP-VRP-26378,sunder,Male,Senior Secondary(upto 12th std),BAGHPAT,7956911245,-,-,Working,Verified,Edit
128,UP-VRP-21230,Sunil kumar,Male,Secondary(upto 1oth std),BAGHPAT,9837610619,-,-,Working,Not Verified,Edit
81,UP-VRP-28223,Surendra,Male,Primary(upto 5th std),BAGHPAT,9528597349,,-,Working,Verified,Edit
83,UP-VRP-28220,Sureshpal,Male,Secondary(upto 1oth std),BAGHPAT,8393814982,pkarya76@gmail.com,-,Working,Not Verified,Edit
121,UP-VRP-26375,Sushil kumar,Male,Secondary(upto 1oth std),BAGHPAT,8791695868,-,-,Working,Verified,Edit
20,UP-VRP-44550,TALIB HASAN,Male,Secondary(upto 1oth std),BAGHPAT,9058632439,-,-,Working,Verified,Edit
61,UP-VRP-37010,Tarun Kumar,Male,Graduate,BAGHPAT,7906330530,Tarun@1975gmail.com,-,Working,Verified,Edit
86,UP-VRP-26722,Tejpal,Male,Graduate,BAGHPAT,9997202522,-,-,Working,Verified,Edit
68,UP-VRP-32996,uma,Female,Secondary(upto 1oth std),BAGHPAT,8866026276,kapilshrma2676@gmail.com,-,Working,Verified,Edit
21,UP-VRP-44548,VIKAS KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,9720228203,-,-,Working,Verified,Edit
129,UP-VRP-21124,Vimla,Female,Primary(upto 5th std),BAGHPAT,7310770172,-,-,Working,Verified,Edit
41,UP-VRP-38908,Vinod Kumar,Male,Secondary(upto 1oth std),BAGHPAT,8755184472,vinod111kumar@gmail.com,-,Working,Verified,Edit
3,UP-VRP-45111,VIPIN KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,8445391988,-,-,Working,Verified,Edit
22,UP-VRP-44538,VIPIN KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,8630144104,-,-,Working,Verified,Edit
110,UP-VRP-26629,vipin kumar,Male,Senior Secondary(upto 12th std),BAGHPAT,9368320223,-,-,Working,Verified,Edit
23,UP-VRP-44531,VIVEK KUMAR,Male,Secondary(upto 1oth std),BAGHPAT,8445830830,-,-,Working,Verified,Edit
78,UP-VRP-28236,yogendra singh,Male,Senior Secondary(upto 12th std),BAGHPAT,9634686390,-,-,Working,Verified,Edit
32,UP-VRP-44493,YOGITA SHARMA,Female,Secondary(upto 1oth std),BAGHPAT,6397137576,-,-,Working,Verified,Edit`;

const baghpatPhones = new Set([
  "9897985142", "8923046436", "8057991090", "8445047834", 
  "9761466719", "9808921164", "9897006306", "9997624355", "8979816474"
]);

const barautPhones = new Set([
  "9811084457", "9520294933", "7956911245", "8171572225", 
  "9897691664", "8923804622", "9720719843", "6397137576", 
  "9410814975", "7895960603", "9548918248", "8077553432"
]);

// Helper for clean Hindi phonetic name conversion
const hindiNameMap = {
  "AMARDEEP": "अमरदीप",
  "Anil Kumar": "अनिल कुमार",
  "ANITA": "अनीता",
  "Anju tyagi": "अंजू त्यागी",
  "Annu": "अन्नू",
  "ANUJ KUMAR": "अनुज कुमार",
  "Anurag Bhardwaj": "अनुराग भारद्वाज",
  "ARUN KUMAR": "अरुण कुमार",
  "Arvind kumar": "अरविंद कुमार",
  "ASHEESH DHAKA": "आशीष ढाका",
  "BABITA": "बबिता",
  "BABLI SHARMA": "बबली शर्मा",
  "Bhrampal": "ब्रह्मपाल",
  "bijendra": "बिजेंद्र",
  "Bijendra": "बिजेंद्र",
  "Bimlesh": "बिमलेश",
  "BITTU RAM": "बिट्टू राम",
  "Dariyav Singh": "दरियाव सिंह",
  "Davender": "देवेंद्र",
  "davendr": "देवेंद्र",
  "DAYANAND": "दयानंद",
  "DEEPALI RANI": "दीपाली रानी",
  "dhankesh sharma": "धनकेश शर्मा",
  "dharamkumar": "धर्मकुमार",
  "GaJendra Dhama": "गजेंद्र धामा",
  "Harendra": "हरेंद्र",
  "IQBAL SINGH": "इक़बाल सिंह",
  "jashbir singh": "जशबीर सिंह",
  "jaymala": "जयमाला",
  "jitendra kumar": "जितेंद्र कुमार",
  "KAMLESH": "कमलेश",
  "Kamlesh": "कमलेश",
  "Kapil": "कपिल",
  "KAPIL DEV SHARMA": "कपिल देव शर्मा",
  "KAPIL TOMAR": "कपिल तोमर",
  "Karan Singh": "करन सिंह",
  "Karuna": "करुणा",
  "KASHMIRE": "काश्मीरे",
  "KAVITA": "कविता",
  "Kavita": "कविता",
  "Kawarpal Singh": "कंवरपाल सिंह",
  "Kirender pal Singh": "किरेंद्र पाल सिंह",
  "Krishanpal": "कृष्णपाल",
  "Kuldeep kumar": "कुलदीप कुमार",
  "LALIT KUMAR": "ललित कुमार",
  "Laxman": "लक्ष्मण",
  "Madan pal": "मदन पाल",
  "Maganvir Singh Dhaka": "मगनवीर सिंह ढाका",
  "Manju": "मंजू",
  "MANOJ KUMAR": "मनोज कुमार",
  "Manoj kumar": "मनोज कुमार",
  "Manoj Kumar": "मनोज कुमार",
  "MINAKSHI": "मीनाक्षी",
  "Mukesh Kumar": "मुकेश कुमार",
  "Narender Kumar": "नरेंद्र कुमार",
  "Naresh": "नरेश",
  "Neelam Devi": "नीलम देवी",
  "Neeraj": "नीरज",
  "NEERAJ DEVI": "नीरज देवी",
  "NIKKI": "निक्की",
  "Nirmala": "निर्मला",
  "NITIN KUMAR": "नितिन कुमार",
  "Om kali": "ओम कली",
  "pawan sharma": "पवन शर्मा",
  "PINKI": "पिंकी",
  "poonam": "पूनम",
  "POONAM SHARMA": "पूनम शर्मा",
  "pradeep kumar": "प्रदीप कुमार",
  "Praveen Kumar": "प्रवीण कुमार",
  "PRAVITA": "प्रविता",
  "Punam": "पूनम",
  "Puspendra": "पुष्पेंद्र",
  "Rachana": "रचना",
  "raj kumar": "राजकुमार",
  "Raj kumar": "राजकुमार",
  "RAJENDRA SINGH CHAUHAN": "राजेंद्र सिंह चौहान",
  "rajesh kumar": "राजेश कुमार",
  "Rajiv Kumar": "राजीव कुमार",
  "Rakhi Sharma": "राखी शर्मा",
  "Rakhi Shrma": "राखी शर्मा",
  "Ramniwas": "रामनिवास",
  "Rampal Singh": "रामपाल सिंह",
  "Ranveer": "रणवीर",
  "RAVI KUMAR TOMAR": "रवि कुमार तोमर",
  "Rohotash Singh": "रोहताश सिंह",
  "roki kashyap": "रोकी कश्यप",
  "SAHDEV Singh ARYA": "सहदेव सिंह आर्य",
  "SANJAY DHAMA": "संजय धामा",
  "Sanjeev Kumar": "संजीव कुमार",
  "Sanjeev Kumar Dhaka": "संजीव कुमार ढाका",
  "sanjiv kumar": "संजीव कुमार",
  "Satender Kumar": "सतेंद्र कुमार",
  "satendra kumar nain": "सतेंद्र कुमार नैन",
  "SATENDRA SINGH": "सतेंद्र सिंह",
  "Satish kumar": "सतीश कुमार",
  "satish kumar sharma": "सतीश कुमार शर्मा",
  "Satishchandra": "सतीशचंद्र",
  "Satyadev Singh": "सत्यदेव सिंह",
  "Savita": "सविता",
  "Shalu": "शालू",
  "Shiv Kumar": "शिव कुमार",
  "Shripal singh": "श्रीपाल सिंह",
  "shrpal singh": "श्रीपाल सिंह",
  "Sompal Singh": "सोमपाल सिंह",
  "Sonika": "सोनिका",
  "SONU KUMAR": "सोनू कुमार",
  "Subhash chand": "सुभाष चंद",
  "sudesh chauhan": "सुदेश चौहान",
  "sudhir KUMAR": "सुधीर कुमार",
  "Sukhdev Singh": "सुखदेव सिंह",
  "SUMAN DEVI": "सुमन देवी",
  "Suman Devi": "सुमन देवी",
  "SUMIT": "सुमित",
  "SUMIT KUMAR": "सुमित कुमार",
  "sunder": "सुंदर",
  "Sunil kumar": "सुनील कुमार",
  "Surendra": "सुरेंद्र",
  "Sureshpal": "सुरेशपाल",
  "Sushil kumar": "सुशील कुमार",
  "TALIB HASAN": "तालिब हसन",
  "Tarun Kumar": "तरुण कुमार",
  "Tejpal": "तेजपाल",
  "uma": "उमा",
  "VIKAS KUMAR": "विकास कुमार",
  "Vimla": "विमला",
  "Vinod Kumar": "विनोड कुमार",
  "VIPIN KUMAR": "विपिन कुमार",
  "vipin kumar": "विपिन कुमार",
  "VIVEK KUMAR": "विवेक कुमार",
  "yogendra singh": "योगेंद्र सिंह",
  "YOGITA SHARMA": "योगिता शर्मा"
};

const lines = raw.trim().split("\n");
const records = lines.map((line, idx) => {
  const p = line.split(",");
  const srNo = parseInt(p[0], 10) || (idx + 1);
  const empCode = p[1].trim();
  const name = p[2].trim();
  const gender = p[3].trim() === "Female" ? "Female" : "Male";
  const qualification = p[4].trim();
  const districtName = p[5].trim();
  const mobileNo = p[6].trim();
  const emailAddress = p[7] && p[7].trim() !== "-" ? p[7].trim() : undefined;
  const dateOfBirth = p[8] && p[8].trim() !== "-" ? p[8].trim() : undefined;
  const employeeStatus = p[9] && p[9].trim().toLowerCase() === "discontinued" ? "Discontinued" : "Working";
  const aadharStatus = p[10] && p[10].trim().toLowerCase() === "verified" ? "Verified" : "Not Verified";

  let assignedBlock = null;
  if (baghpatPhones.has(mobileNo)) assignedBlock = "Baghpat";
  else if (barautPhones.has(mobileNo)) assignedBlock = "Baraut";

  const nameHindi = hindiNameMap[name] || name;

  return {
    id: `vrp-${empCode}`,
    srNo,
    empCode,
    name,
    nameHindi,
    gender,
    qualification,
    districtName,
    mobileNo,
    emailAddress,
    dateOfBirth,
    employeeStatus,
    aadharStatus,
    assignedBlock
  };
});

console.log("Total records:", records.length);
console.log("Baghpat assigned:", records.filter(r => r.assignedBlock === "Baghpat").length);
console.log("Baraut assigned:", records.filter(r => r.assignedBlock === "Baraut").length);
console.log("Reserve pool:", records.filter(r => !r.assignedBlock).length);

const outContent = `// ============================================================================
// Master VRP (Village Resource Person) / Team Members Dataset - Baghpat District
// Source: Social Audit Unit (SAU) Master Records & Block Team Allocations
// ============================================================================

import { VRPMember } from '@/types/socialAudit';

export const INITIAL_VRP_RECORDS: VRPMember[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync('src/data/vrpInitialData.ts', outContent, 'utf8');
console.log("Successfully wrote src/data/vrpInitialData.ts");

