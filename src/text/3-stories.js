// ===== Bilingual text, part 3 =====
const NOTE = {
  en:{ repaid:'Paid off ${0}M of old debt.', relief:'Cheap food imports eased shortages.', grantPop:'Families received a cash gift.', wage:'Public salaries rose {0}%.', decree:'Decree issued: {0}.',
    projStart:'Construction started in {0}. Ready in {1}.', projStartLeak:'Construction started in {0}. Ready in {1}. About ${2}M will be lost to corruption.',
    projDone:'Finished in {0}: {1}.', projDoneLeak:'Finished in {0}: {1}. ${2}M disappeared along the way.',
    facSign:'Signed: {0}.', facFrozen:'{0}: you broke the conditions, so the rest of the money is frozen.', grant:'${0}M in grant money arrived for projects.',
    wbGrid:'World Bank money is building {0} MW of power (ready in 2 seasons).', gridDone:'New power stations came online: +{0} MW.', private:'Private investors rebuilt about ${0}M of damaged buildings.' },
  ar:{ repaid:'سُدّد {0} مليون دولار من الديون القديمة.', relief:'الغذاء المستورد الرخيص خفّف النقص.', grantPop:'حصلت العائلات على منحة نقدية.', wage:'ارتفعت رواتب الدولة بنسبة {0}%.', decree:'صدر مرسوم: {0}.',
    projStart:'بدأ البناء في {0}. يجهز خلال {1}.', projStartLeak:'بدأ البناء في {0}. يجهز خلال {1}. سيضيع حوالي {2} مليون$ بسبب الفساد.',
    projDone:'اكتمل في {0}: {1}.', projDoneLeak:'اكتمل في {0}: {1}. اختفى {2} مليون$ على الطريق.',
    facSign:'تم التوقيع: {0}.', facFrozen:'{0}: خالفتَ الشروط، فجُمِّد باقي المال.', grant:'وصل {0} مليون$ من أموال المنح للمشاريع.',
    wbGrid:'أموال البنك الدولي تبني {0} ميغاواط (جاهزة بعد موسمين).', gridDone:'دخلت محطات كهرباء جديدة الخدمة: +{0} ميغاواط.', private:'أعاد مستثمرون بناء مبانٍ مدمّرة بقيمة {0} مليون$ تقريباً.' },
};

const FAIL_TXT = {
  default:{ en:['Out of dollars','The central bank ran out of dollars. Wheat and fuel ships turned around at sea, creditors seized the phosphate mines, and the lira collapsed. The government resigned within a week.','Watch the 🏦 dollars box. Sign a loan early and stop paying for cheap fuel.'],
    ar:['نفدت الدولارات','نفد الدولار من المصرف المركزي. عادت سفن القمح والوقود أدراجها، ووضع الدائنون يدهم على مناجم الفوسفات، وانهارت الليرة. استقالت الحكومة خلال أسبوع.','راقب مربع 🏦 الدولار. وقّع قرضاً مبكراً وتوقف عن دعم الوقود.'] },
  hyper:{ en:['Prices out of control','Prices doubled faster than salaries could be paid. Shops stopped using the lira, and the state lost control of its own money.','Printing money feels free, but it wrecks prices. Collect tax and cut subsidies instead.'],
    ar:['الأسعار خارج السيطرة','تضاعفت الأسعار أسرع من دفع الرواتب. توقفت المحلات عن التعامل بالليرة، وفقدت الدولة السيطرة على عملتها.','طباعة النقود تبدو مجانية لكنها تدمّر الأسعار. اجمع الضرائب وخفّف الدعم بدلاً منها.'] },
  uprising:{ en:['Nationwide uprising','Revolt spread across {0} provinces at once. Security forces couldn’t hold the streets, and crowds reached the palace gates.','Watch the map. When provinces turn orange, build projects there and improve electricity.'],
    ar:['انتفاضة شاملة','انتشر التمرّد في {0} محافظات دفعة واحدة. عجزت قوات الأمن عن ضبط الشوارع ووصلت الحشود إلى أبواب القصر.','راقب الخريطة. عندما تصبح المحافظات برتقالية ابنِ فيها مشاريع وحسّن الكهرباء.'] },
  coup:{ en:['Military takeover','Soldiers earning less than $8 a month watched their commanders get rich. The generals announced a “salvation council” and put you under house arrest.','Keep soldiers’ pay up and fight corruption with the Integrity Commission.'],
    ar:['انقلاب عسكري','جنود يكسبون أقل من 8$ في الشهر رأوا قادتهم يغتنون. أعلن الجنرالات «مجلس إنقاذ» ووضعوك قيد الإقامة الجبرية.','حافظ على رواتب الجنود وحارب الفساد بهيئة النزاهة.'] },
  fracture:{ en:['The country breaks apart','Suwayda and the east declared self-rule in the same week and cut the oil and wheat routes to the capital. Foreign powers moved in to protect the new mini-states.','Use the Suwayda deal and the northeast accord before anger gets too high.'],
    ar:['البلاد تتفكّك','أعلنت السويداء والشرق الحكم الذاتي في الأسبوع نفسه وقطعا طرق النفط والقمح إلى العاصمة. دخلت قوى أجنبية لحماية الدويلات الجديدة.','استخدم اتفاق السويداء واتفاق الشمال الشرقي قبل أن يرتفع الغضب كثيراً.'] },
  paralysis:{ en:['Nobody listens anymore','Nobody obeyed a decree and nobody believed a speech. Ministries stopped reporting to you and governors ran their own budgets.','Don’t spend all your influence at once, and don’t let trust collapse.'],
    ar:['لم يعد أحد يسمع','لم ينفّذ أحد مرسوماً ولم يصدّق أحد خطاباً. توقفت الوزارات عن مراجعتك وصار المحافظون يديرون ميزانياتهم بأنفسهم.','لا تنفق كل نفوذك دفعة واحدة، ولا تدع الثقة تنهار.'] },
};

const LEGACY_TXT = {
  en:{ names:{ Stability:'🕊️ Peace', Livelihoods:'👷 Living standards', Reconstruction:'🏗️ Rebuilding', Institutions:'🧾 Honest government', Solvency:'🏦 Money', Sovereignty:'🧭 Independence' },
    lower:{ Stability:'peace', Livelihoods:'living standards', Reconstruction:'rebuilding', Institutions:'honest government', Solvency:'money', Sovereignty:'independence' },
    verdict:{ A:'Historians call you the president who rebuilt Syria.', B:'The country is whole and working. Not rich yet, but on its way.', C:'You held the country together. The next president has a lot left to do.', D:'Syria survived, just barely.', F:'You lasted 20 years. That is the best that can be said.' } },
  ar:{ names:{ Stability:'🕊️ السلم', Livelihoods:'👷 مستوى المعيشة', Reconstruction:'🏗️ إعادة الإعمار', Institutions:'🧾 نزاهة الحكومة', Solvency:'🏦 المال', Sovereignty:'🧭 الاستقلال' },
    lower:{ Stability:'السلم', Livelihoods:'مستوى المعيشة', Reconstruction:'إعادة الإعمار', Institutions:'نزاهة الحكومة', Solvency:'المال', Sovereignty:'الاستقلال' },
    verdict:{ A:'يسمّيك المؤرخون الرئيس الذي أعاد بناء سوريا.', B:'البلاد موحّدة وتعمل. ليست غنية بعد، لكنها على الطريق.', C:'حافظتَ على وحدة البلاد. أمام الرئيس القادم عمل كثير.', D:'نجت سوريا بصعوبة.', F:'بقيتَ عشرين عاماً. هذا أفضل ما يمكن قوله.' } },
};

const MISSION_TXT = {
  winter:{ icon:'❄️', en:['Keep the lights on','It’s winter 2027 and the grid is failing. Reach 7 hours of electricity a day within 8 seasons, with no province in revolt.','Lesson: power stations take time. Invest early, before you see results.'],
    ar:['أبقِ الأنوار مضاءة','إنه شتاء 2027 والشبكة تنهار. اوصل إلى 7 ساعات كهرباء يومياً خلال 8 مواسم دون تمرّد أي محافظة.','الدرس: محطات الكهرباء تحتاج وقتاً. استثمر مبكراً قبل أن ترى النتائج.'] },
  lira:{ icon:'💱', en:['Save the lira','The last government printed money like crazy. A dollar costs 260 lira and prices rise 90% a year. Within 8 seasons, get the dollar under 340 lira and yearly price rises under 30%.','Lesson: printing money is a trap. Breaking out of it hurts at first.'],
    ar:['أنقِذ الليرة','الحكومة السابقة طبعت النقود بجنون. الدولار بـ260 ليرة والأسعار ترتفع 90% سنوياً. خلال 8 مواسم، اجعل الدولار تحت 340 ليرة والتضخم تحت 30%.','الدرس: طباعة النقود فخ، والخروج منه مؤلم في البداية.'] },
  bread:{ icon:'🌾', en:['Feed the country','Drought has hit the northeast. Wheat imports will cost double for 8 seasons. Finish with trust at 40+, at least $250M in the bank, and Hasakeh’s anger below 55.','Lesson: food is a supply chain. Farms, silos, fuel and dollars all have to work.'],
    ar:['أطعِم البلاد','ضرب الجفاف الشمال الشرقي. استيراد القمح سيكلّف الضعف لثمانية مواسم. أنهِ المهمة بثقة 40+ و250 مليون$ على الأقل في المصرف وغضب الحسكة تحت 55.','الدرس: الغذاء سلسلة إمداد. المزارع والصوامع والوقود والدولار كلها يجب أن تعمل.'] },
  capital:{ icon:'🏙️', en:['Calm the capital','Rural Damascus is close to revolt and the city is restless. Within 8 seasons, get Rural Damascus under 50 and Damascus city under 45.','Lesson: the capital and its countryside are different places with different problems.'],
    ar:['هدّئ العاصمة','ريف دمشق على وشك التمرّد والمدينة متوترة. خلال 8 مواسم، اجعل غضب ريف دمشق تحت 50 ومدينة دمشق تحت 45.','الدرس: العاصمة وريفها مكانان مختلفان بمشاكل مختلفة.'] },
};

const PERSONA_TXT = {
  rana:{ icon:'👩‍🏫', prov:'aleppo', en:['Rana, 34','Teacher in Aleppo, two kids'], ar:['رنا، 34 عاماً','معلّمة في حلب، ولديها طفلان'] },
  khaled:{ icon:'👨‍🌾', prov:'hasakeh', en:['Abu Khaled, 52','Wheat farmer in Hasakeh'], ar:['أبو خالد، 52 عاماً','مزارع قمح في الحسكة'] },
  hiba:{ icon:'🧕', prov:'rif', en:['Hiba, 27','Returned from Lebanon to Rural Damascus'], ar:['هبة، 27 عاماً','عادت من لبنان إلى ريف دمشق'] },
  samer:{ icon:'🧑‍💼', prov:'damascus', en:['Samer, 41','Runs a phone repair shop in Damascus'], ar:['سامر، 41 عاماً','يدير محل تصليح هواتف في دمشق'] },
};
const PERSONA_LINES = {
  en:{ salary:'Salary', side:'Tutoring on the side', brother:'Money from her brother in Germany', crop:'Selling the wheat crop', labor:'Day labor on building sites', shop:'Shop profits',
    food:'Food', bread:'Bread', generator:'Generator (blackouts)', transport:'Transport', rent:'Rent', diesel:'Diesel for the water pump', seeds:'Seeds and fertilizer', bribes:'Bribes and “fees”', stock:'Spare parts (imported)',
    s_ok:'The family is getting by and saving a little each month.', s_tight:'Every month is tight. One emergency and the family is in debt.', s_bad:'The family can’t cover the basics. Skipping meals and borrowing.', s_leave:'The family is talking about leaving Syria.',
    why_power:'The generator bill is eating everything.', why_pay:'The salary buys less every month.', why_bread:'Bread got expensive.', why_drought:'The drought ruined the harvest.', why_nojobs:'There is no steady work in the province.', why_home:'Paying rent because the family home is still rubble.', why_homeback:'Got the family home back through the property portal.', why_bribes:'Officials keep asking for “fees”.', why_fx:'Imported parts get pricier as the dollar rises.' },
  ar:{ salary:'الراتب', side:'دروس خصوصية', brother:'حوالة من أخيها في ألمانيا', crop:'بيع محصول القمح', labor:'عمل يومي في ورشات البناء', shop:'أرباح المحل',
    food:'الطعام', bread:'الخبز', generator:'المولّدة (التقنين)', transport:'المواصلات', rent:'الإيجار', diesel:'مازوت مضخة المياه', seeds:'البذار والسماد', bribes:'رشاوى و«رسوم»', stock:'قطع غيار (مستوردة)',
    s_ok:'الأمور ماشية. العائلة تدّخر قليلاً كل شهر.', s_tight:'كل شهر صعب. أي طارئ يُغرق العائلة في الدين.', s_bad:'العائلة لا تغطي الأساسيات، تستغني عن وجبات وتستدين.', s_leave:'العائلة تفكّر في مغادرة سوريا.',
    why_power:'فاتورة المولّدة تأكل كل شيء.', why_pay:'الراتب يشتري أقل كل شهر.', why_bread:'الخبز صار غالياً.', why_drought:'الجفاف دمّر المحصول.', why_nojobs:'لا عمل ثابت في المحافظة.', why_home:'تدفع العائلة إيجاراً لأن بيتها ما زال ركاماً.', why_homeback:'استعادت العائلة بيتها عبر منصة الملكيات.', why_bribes:'الموظفون يطلبون «رسوماً» باستمرار.', why_fx:'قطع الغيار المستوردة تغلو مع ارتفاع الدولار.' },
};

const CHAIN_TXT = {
  en:{ farms:'Farms', silos:'Silos', ports:'Ports & imports', mills:'Flour mills', trucks:'Trucks', bakeries:'Bakeries', families:'Families',
    oilfields:'Oil fields', fuelimp:'Fuel imports', refinery:'Refinery', plants:'Power plants', gridlines:'Grid', homes:'Homes & factories',
    r_farms_ok:'Northeast farms are working.', r_farms_bad:'Anger or drought in Hasakeh and Raqqa is hurting farms.', r_silos_ok:'New silos store the harvest.', r_silos_bad:'No proper silos. Wheat rots or gets smuggled. Build the Hasakeh project.',
    r_ports_ok:'Enough dollars to import wheat.', r_ports_bad:'Few dollars left to buy wheat abroad.', r_mills_ok:'Mills have enough power.', r_mills_bad:'Blackouts stop the mills.',
    r_trucks_ok:'Diesel is available and roads are safe.', r_trucks_bad:'Diesel shortages or unsafe desert roads.', r_bak_ok:'Bread is affordable.', r_bak_bad:'Without subsidies, bread is expensive.',
    r_fam_ok:'Salaries cover bread.', r_fam_bad:'Salaries are too low to buy enough bread.',
    r_oil_ok:'Eastern oil is flowing.', r_oil_bad:'Unrest in the east and no deal with the tribes or the northeast.', r_fimp_ok:'Dollars cover fuel imports.', r_fimp_bad:'Not enough dollars for fuel.',
    r_ref_ok:'The Homs refinery was repaired.', r_ref_bad:'The Homs refinery barely works.', r_pl_ok:'Power plants cover a good share of demand.', r_pl_bad:'Plants make only a fraction of what the country needs.',
    r_grid_ok:'You are investing in the grid.', r_grid_bad:'No grid investment. Lines and stations decay.', r_homes_ok:'Most people have power most of the day.', r_homes_bad:'Long daily blackouts.' },
  ar:{ farms:'المزارع', silos:'الصوامع', ports:'الموانئ والاستيراد', mills:'المطاحن', trucks:'الشاحنات', bakeries:'الأفران', families:'العائلات',
    oilfields:'حقول النفط', fuelimp:'استيراد الوقود', refinery:'المصفاة', plants:'محطات التوليد', gridlines:'الشبكة', homes:'البيوت والمصانع',
    r_farms_ok:'مزارع الشمال الشرقي تعمل.', r_farms_bad:'الغضب أو الجفاف في الحسكة والرقة يضرّ المزارع.', r_silos_ok:'صوامع جديدة تخزّن المحصول.', r_silos_bad:'لا صوامع مناسبة. القمح يتلف أو يُهرَّب. ابنِ مشروع الحسكة.',
    r_ports_ok:'دولارات كافية لاستيراد القمح.', r_ports_bad:'دولارات قليلة لشراء القمح من الخارج.', r_mills_ok:'المطاحن لديها كهرباء كافية.', r_mills_bad:'التقنين يوقف المطاحن.',
    r_trucks_ok:'المازوت متوفر والطرق آمنة.', r_trucks_bad:'نقص في المازوت أو طرق صحراوية غير آمنة.', r_bak_ok:'الخبز بسعر مقبول.', r_bak_bad:'من دون دعم، الخبز غالٍ.',
    r_fam_ok:'الرواتب تكفي للخبز.', r_fam_bad:'الرواتب منخفضة جداً لشراء خبز كافٍ.',
    r_oil_ok:'نفط الشرق يتدفق.', r_oil_bad:'اضطرابات في الشرق ولا اتفاق مع العشائر أو الشمال الشرقي.', r_fimp_ok:'الدولارات تغطي استيراد الوقود.', r_fimp_bad:'لا دولارات كافية للوقود.',
    r_ref_ok:'أُصلحت مصفاة حمص.', r_ref_bad:'مصفاة حمص بالكاد تعمل.', r_pl_ok:'المحطات تغطي حصة جيدة من الطلب.', r_pl_bad:'المحطات تنتج جزءاً صغيراً مما تحتاجه البلاد.',
    r_grid_ok:'أنت تستثمر في الشبكة.', r_grid_bad:'لا استثمار في الشبكة. الخطوط والمحطات تتهالك.', r_homes_ok:'معظم الناس لديهم كهرباء معظم اليوم.', r_homes_bad:'تقنين طويل كل يوم.' },
};

const CYCLE_TXT = {
  printing:{ bad:true, en:['The money-printing trap',['Print money','Dollar gets pricier','Salaries shrink','Bribes spread','Less tax collected','Bigger deficit']], ar:['فخ طباعة النقود',['طباعة النقود','الدولار يغلو','الرواتب تنكمش','الرشوة تنتشر','ضرائب أقل','عجز أكبر']] },
  growth:{ bad:false, en:['The power-to-prosperity cycle',['Build power','Factories run','Exports grow','More dollars','More investment']], ar:['حلقة الكهرباء والازدهار',['بناء الكهرباء','المصانع تعمل','الصادرات تنمو','دولارات أكثر','استثمار أكثر']] },
  trust:{ bad:false, en:['The trust cycle',['People trust you','Investors return','Buildings rebuilt','Less anger','More trust']], ar:['حلقة الثقة',['الناس يثقون بك','المستثمرون يعودون','إعادة بناء المباني','غضب أقل','ثقة أكثر']] },
  anger:{ bad:true, en:['Anger spreads',['One province explodes','Neighbors get angry','Trade and roads break','Jobs vanish','More anger']], ar:['الغضب ينتشر',['محافظة تنفجر','الجيران يغضبون','التجارة والطرق تنقطع','الوظائف تختفي','غضب أكبر']] },
  debt:{ bad:true, en:['The debt trap',['Borrow dollars','Pay interest','Fewer dollars left','Borrow again','Less independence']], ar:['فخ الديون',['اقتراض الدولار','دفع الفوائد','دولارات أقل','اقتراض من جديد','استقلال أقل']] },
};

const HIST_TXT = {
  lebanon:{ en:['Lebanon, 2019 to today','Lebanon’s banks and currency collapsed starting in 2019. The lira lost over 90% of its value, and in 2020 the government stopped paying its foreign debts. Savings were frozen and many young people emigrated.'],
    ar:['لبنان، من 2019 حتى اليوم','انهارت مصارف لبنان وعملته بدءاً من 2019. خسرت الليرة أكثر من 90% من قيمتها، وفي 2020 توقفت الحكومة عن سداد ديونها الخارجية. جُمّدت المدخرات وهاجر كثير من الشباب.'] },
  zimbabwe:{ en:['Zimbabwe, 2008','The government printed money to pay its bills until prices doubled almost daily. In 2009 Zimbabwe abandoned its own currency and people used US dollars and other foreign currencies instead.'],
    ar:['زيمبابوي، 2008','طبعت الحكومة النقود لتدفع فواتيرها حتى صارت الأسعار تتضاعف يومياً تقريباً. في 2009 تخلّت زيمبابوي عن عملتها واستخدم الناس الدولار الأمريكي وعملات أجنبية أخرى.'] },
  germany:{ en:['West Germany, 1948','After World War II the old money was worthless. A currency reform replaced it with the Deutsche Mark and most price controls were lifted. Within weeks, goods returned to empty shops.'],
    ar:['ألمانيا الغربية، 1948','بعد الحرب العالمية الثانية صارت العملة القديمة بلا قيمة. استبدلها إصلاح نقدي بالمارك الألماني ورُفعت معظم قيود الأسعار. خلال أسابيع عادت البضائع إلى المحلات الفارغة.'] },
  rwanda:{ en:['Rwanda, after 1994','After the genocide, Rwanda used community courts called gacaca to handle more than a million cases. The country focused on stability and services and became one of Africa’s faster-growing economies.'],
    ar:['رواندا، بعد 1994','بعد الإبادة الجماعية، استخدمت رواندا محاكم مجتمعية اسمها «غاتشاتشا» للنظر في أكثر من مليون قضية. ركّزت البلاد على الاستقرار والخدمات وصارت من الاقتصادات الأسرع نمواً في أفريقيا.'] },
  iraq:{ en:['Iraq, 2003','After the invasion, the army was dissolved and many public workers were fired. Hundreds of thousands of armed, angry men lost their income, and an insurgency grew.'],
    ar:['العراق، 2003','بعد الغزو حُلّ الجيش وفُصل كثير من موظفي الدولة. فقد مئات الآلاف من الرجال المسلّحين الغاضبين دخلهم، وتنامى التمرّد.'] },
};

const ADV = {
  en:{ usd:'Dollars will run out in about {0} seasons. That’s game over.', usdAct:'Sign the IMF loan, set fuel to real price, or make the tribal pact for oil money.',
    cash:'Government cash is below zero and falling. Prices will climb faster.', cashAct:'Tougher tax collection, real fuel prices, or the payroll audit decree.',
    pay:'Salaries (${0}) are far below what people expect (${1}).', payAct:'A 10% raise in the Money tab. It costs cash every season after.',
    grid:'Only a few hours of electricity, and no investment in power stations.', gridAct:'Set power stations to $20M or $40M. It pays off in 2 seasons.',
    print:'You are printing money. It feels free but it makes the dollar more expensive.', printAct:'Cut printing and fix the budget another way.',
    calmEcon:'The money looks okay this season.', calmEconAct:'Build a project that earns money, like a port or a refinery.',
    prov:'{0} is close to revolt (anger {1}).', provAct:'Build its project, or calm the whole country with a decree.',
    heavy:'Anger is high. More police on the streets would calm things fast.', heavyAct:'Set security to Many. (The economist will say it costs too much.)',
    spend:'You have {0} influence to spend.', spendAct:'Decrees are your strongest tools. Pick one that fixes your biggest problem.',
    calmSec:'The streets are calm.', calmSecAct:'Keep an eye on the orange provinces on the map.' },
  ar:{ usd:'ستنفد الدولارات خلال {0} مواسم تقريباً. عندها تنتهي اللعبة.', usdAct:'وقّع قرض صندوق النقد، أو اجعل الوقود بسعره الحقيقي، أو اعقد الميثاق العشائري لأموال النفط.',
    cash:'نقد الحكومة تحت الصفر ويستمر بالهبوط. الأسعار سترتفع أسرع.', cashAct:'جباية ضرائب أشد، وقود بسعره الحقيقي، أو مرسوم تدقيق الرواتب.',
    pay:'الرواتب ({0}$) أقل بكثير مما يتوقعه الناس ({1}$).', payAct:'زيادة 10% من تبويب المال. تكلّف نقداً كل موسم بعدها.',
    grid:'ساعات كهرباء قليلة جداً، ولا استثمار في المحطات.', gridAct:'خصّص 20 أو 40 مليون$ للمحطات. تُثمر بعد موسمين.',
    print:'أنت تطبع النقود. تبدو مجانية لكنها ترفع سعر الدولار.', printAct:'أوقف الطباعة وأصلح الميزانية بطريقة أخرى.',
    calmEcon:'الوضع المالي مقبول هذا الموسم.', calmEconAct:'ابنِ مشروعاً يكسب مالاً، مثل ميناء أو مصفاة.',
    prov:'{0} على وشك التمرّد (الغضب {1}).', provAct:'ابنِ مشروعها، أو هدّئ البلاد كلها بمرسوم.',
    heavy:'الغضب مرتفع. انتشار أمني أكبر سيهدّئ الوضع بسرعة.', heavyAct:'اجعل الأمن «كثيفاً». (المستشار الاقتصادي سيقول إنه مكلف جداً.)',
    spend:'لديك {0} نفوذ للإنفاق.', spendAct:'المراسيم أقوى أدواتك. اختر واحداً يعالج أكبر مشكلة لديك.',
    calmSec:'الشوارع هادئة.', calmSecAct:'راقب المحافظات البرتقالية على الخريطة.' },
};

// "Why did this happen?" phrases
const WHY = {
  en:{ fxUp:'Dollar +{0}%', fxDown:'Dollar {0}%', payDown:'Salary lost ${0}', payUp:'Salary gained ${0}', trustDown:'Trust −{0}', trustUp:'Trust +{0}', angerUp:'Anger +{0}', angerDown:'Anger −{0}',
    print:'You printed {0}bn lira', reserves:'Few dollars left in the bank', reservesGood:'Plenty of dollars in the bank', deficit:'Government cash below zero', lowTrust:'People don’t trust the government', highTrust:'People trust the government', intervene:'You sold dollars to protect the lira', shock:'A crisis shook the lira', base:'Normal price rises', tradeGood:'The country earns more dollars than it spends', tradeBad:'The country spends more dollars than it earns',
    t_bread:'Bread policy', t_fuel:'Fuel policy', t_pay:'Salaries vs what people expect', t_power:'Electricity', t_prices:'Prices', t_security:'Police on the streets', t_tax:'Tough tax collection', t_anger:'Angry provinces', t_jobs:'Work', t_bar:'People expect more than they used to', t_debt:'Government cash deep below zero', t_decrees:'Your decrees', t_foreign:'Foreign hands on the country',
    a_trust:'Low trust', a_pay:'Low salaries', a_power:'Blackouts', a_subsidies:'Subsidy cuts', a_security:'Security level', a_damage:'War damage', a_jobs:'People with no work', a_bar:'People expect more than they used to', a_prices:'Rising prices', a_local:'Local grievances', a_neighbors:'Anger spreading from neighbors', a_foreign:'Foreigners deciding for Syria', a_smuggling:'The border crackdown', b_trust:'People trust you', b_pay:'Better salaries', b_power:'Better electricity', b_subsidies:'Subsidies', b_security:'Police on the streets', b_damage:'Rebuilding', b_jobs:'Factories are hiring', b_bar:'Expectations', b_prices:'Stable prices', b_local:'Local deals and projects', b_neighbors:'Calm neighbors', b_foreign:'Decisions back in Syrian hands', b_smuggling:'The crossings left alone',
    cashDown:'Government cash −{0}bn', cashUp:'Government cash +{0}bn', usdDown:'Dollars −${0}M', usdUp:'Dollars +${0}M', biggestCost:'Biggest cost: {0}', biggestIncome:'Biggest income: {0}',
    powerUp:'Electricity +{0}h', gridArrived:'New power stations came online', noneYet:'Nothing dramatic this season. Small changes add up, though.' },
  ar:{ fxUp:'الدولار +{0}%', fxDown:'الدولار {0}%', payDown:'الراتب خسر {0}$', payUp:'الراتب ربح {0}$', trustDown:'الثقة −{0}', trustUp:'الثقة +{0}', angerUp:'الغضب +{0}', angerDown:'الغضب −{0}',
    print:'طبعتَ {0} مليار ليرة', reserves:'دولارات قليلة في المصرف', reservesGood:'دولارات كثيرة في المصرف', deficit:'نقد الحكومة تحت الصفر', lowTrust:'الناس لا يثقون بالحكومة', highTrust:'الناس يثقون بالحكومة', intervene:'بعتَ دولارات لحماية الليرة', shock:'أزمة هزّت الليرة', base:'ارتفاع الأسعار الطبيعي', tradeGood:'البلاد تكسب دولارات أكثر مما تنفق', tradeBad:'البلاد تنفق دولارات أكثر مما تكسب',
    t_bread:'سياسة الخبز', t_fuel:'سياسة الوقود', t_pay:'الرواتب مقارنة بتوقعات الناس', t_power:'الكهرباء', t_prices:'الأسعار', t_security:'الانتشار الأمني', t_tax:'الجباية الصارمة', t_anger:'المحافظات الغاضبة', t_jobs:'العمل', t_bar:'الناس صاروا يتوقعون أكثر', t_debt:'نقد الحكومة تحت الصفر بكثير', t_decrees:'مراسيمك', t_foreign:'أيدٍ أجنبية على البلاد',
    a_trust:'ثقة منخفضة', a_pay:'رواتب منخفضة', a_power:'التقنين', a_subsidies:'خفض الدعم', a_security:'مستوى الأمن', a_damage:'دمار الحرب', a_jobs:'ناس بلا عمل', a_bar:'الناس صاروا يتوقعون أكثر', a_prices:'ارتفاع الأسعار', a_local:'مظالم محلية', a_neighbors:'الغضب ينتقل من الجيران', a_foreign:'الأجانب يقررون عن سوريا', a_smuggling:'التشديد على الحدود', b_trust:'الناس يثقون بك', b_pay:'رواتب أفضل', b_power:'كهرباء أفضل', b_subsidies:'الدعم', b_security:'الانتشار الأمني', b_damage:'إعادة الإعمار', b_jobs:'المصانع توظّف', b_bar:'التوقعات', b_prices:'استقرار الأسعار', b_local:'اتفاقات ومشاريع محلية', b_neighbors:'جيران هادئون', b_foreign:'القرار عاد إلى أيدٍ سورية', b_smuggling:'المعابر دون تشديد',
    cashDown:'نقد الحكومة −{0} مليار', cashUp:'نقد الحكومة +{0} مليار', usdDown:'الدولارات −{0} مليون$', usdUp:'الدولارات +{0} مليون$', biggestCost:'أكبر مصروف: {0}', biggestIncome:'أكبر دخل: {0}',
    powerUp:'الكهرباء +{0} ساعة', gridArrived:'دخلت محطات جديدة الخدمة', noneYet:'لا شيء دراماتيكي هذا الموسم، لكن التغييرات الصغيرة تتراكم.' },
};

const CHIP = {
  en:{ usd:'{0}${1}M dollars', syp:'{0}{1}bn cash', pc:'Influence {0}', trust:'Trust {0}', unrest:'Anger {0} everywhere', prov:'{0} anger {1}', corr:'Corruption {0}', sov:'Independence {0}', cap:'Economy {0}', comp:'Tax paying {0}', mw:'Electricity {0} MW', debt:'+${0}M debt', fxUp:'Dollar price +{0}%', fxDown:'Dollar price {0}%', wage:'Salaries +{0}%', phos:'Less mining income forever', remit:'More dollars from abroad' },
  ar:{ usd:'{0}{1} مليون$', syp:'{0}{1} مليار نقداً', pc:'النفوذ {0}', trust:'الثقة {0}', unrest:'الغضب {0} في كل مكان', prov:'غضب {0} {1}', corr:'الفساد {0}', sov:'الاستقلال {0}', cap:'الاقتصاد {0}', comp:'دفع الضرائب {0}', mw:'الكهرباء {0} ميغاواط', debt:'+{0} مليون$ دَين', fxUp:'سعر الدولار +{0}%', fxDown:'سعر الدولار {0}%', wage:'الرواتب +{0}%', phos:'دخل تعدين أقل للأبد', remit:'دولارات أكثر من الخارج' },
};
