// বাংলাদেশের বিভাগ > জেলা > উপজেলা ডেটা (সম্পূর্ণ জাতীয় ডাটাবেস)
export interface Division {
  name: string;
  name_bn: string;
  districts: District[];
}

export interface District {
  name: string;
  name_bn: string;
  upazilas: Upazila[];
}

export interface Upazila {
  name: string;
  name_bn: string;
}

export const divisions: Division[] = [
  {
    "name": "Chittagong",
    "name_bn": "চট্টগ্রাম",
    "districts": [
      {
        "name": "Comilla",
        "name_bn": "কুমিল্লা",
        "upazilas": [
          {
            "name": "Debidwar",
            "name_bn": "দেবিদ্বার"
          },
          {
            "name": "Barura",
            "name_bn": "বরুড়া"
          },
          {
            "name": "Brahmanpara",
            "name_bn": "ব্রাহ্মণপাড়া"
          },
          {
            "name": "Chandina",
            "name_bn": "চান্দিনা"
          },
          {
            "name": "Chauddagram",
            "name_bn": "চৌদ্দগ্রাম"
          },
          {
            "name": "Daudkandi",
            "name_bn": "দাউদকান্দি"
          },
          {
            "name": "Homna",
            "name_bn": "হোমনা"
          },
          {
            "name": "Laksam",
            "name_bn": "লাকসাম"
          },
          {
            "name": "Muradnagar",
            "name_bn": "মুরাদনগর"
          },
          {
            "name": "Nangalkot",
            "name_bn": "নাঙ্গলকোট"
          },
          {
            "name": "Comilla Sadar",
            "name_bn": "কুমিল্লা সদর"
          },
          {
            "name": "Meghna",
            "name_bn": "মেঘনা"
          },
          {
            "name": "Monohargonj",
            "name_bn": "মনোহরগঞ্জ"
          },
          {
            "name": "Sadarsouth",
            "name_bn": "সদর দক্ষিণ"
          },
          {
            "name": "Titas",
            "name_bn": "তিতাস"
          },
          {
            "name": "Burichang",
            "name_bn": "বুড়িচং"
          },
          {
            "name": "Lalmai",
            "name_bn": "লালমাই"
          }
        ]
      },
      {
        "name": "Feni",
        "name_bn": "ফেনী",
        "upazilas": [
          {
            "name": "Chhagalnaiya",
            "name_bn": "ছাগলনাইয়া"
          },
          {
            "name": "Feni Sadar",
            "name_bn": "ফেনী সদর"
          },
          {
            "name": "Sonagazi",
            "name_bn": "সোনাগাজী"
          },
          {
            "name": "Fulgazi",
            "name_bn": "ফুলগাজী"
          },
          {
            "name": "Parshuram",
            "name_bn": "পরশুরাম"
          },
          {
            "name": "Daganbhuiyan",
            "name_bn": "দাগনভূঞা"
          }
        ]
      },
      {
        "name": "Brahmanbaria",
        "name_bn": "ব্রাহ্মণবাড়িয়া",
        "upazilas": [
          {
            "name": "Brahmanbaria Sadar",
            "name_bn": "ব্রাহ্মণবাড়িয়া সদর"
          },
          {
            "name": "Kasba",
            "name_bn": "কসবা"
          },
          {
            "name": "Nasirnagar",
            "name_bn": "নাসিরনগর"
          },
          {
            "name": "Sarail",
            "name_bn": "সরাইল"
          },
          {
            "name": "Ashuganj",
            "name_bn": "আশুগঞ্জ"
          },
          {
            "name": "Akhaura",
            "name_bn": "আখাউড়া"
          },
          {
            "name": "Nabinagar",
            "name_bn": "নবীনগর"
          },
          {
            "name": "Bancharampur",
            "name_bn": "বাঞ্ছারামপুর"
          },
          {
            "name": "Bijoynagar",
            "name_bn": "বিজয়নগর"
          }
        ]
      },
      {
        "name": "Rangamati",
        "name_bn": "রাঙ্গামাটি",
        "upazilas": [
          {
            "name": "Rangamati Sadar",
            "name_bn": "রাঙ্গামাটি সদর"
          },
          {
            "name": "Kaptai",
            "name_bn": "কাপ্তাই"
          },
          {
            "name": "Kawkhali",
            "name_bn": "কাউখালী"
          },
          {
            "name": "Baghaichari",
            "name_bn": "বাঘাইছড়ি"
          },
          {
            "name": "Barkal",
            "name_bn": "বরকল"
          },
          {
            "name": "Langadu",
            "name_bn": "লংগদু"
          },
          {
            "name": "Rajasthali",
            "name_bn": "রাজস্থলী"
          },
          {
            "name": "Belaichari",
            "name_bn": "বিলাইছড়ি"
          },
          {
            "name": "Juraichari",
            "name_bn": "জুরাছড়ি"
          },
          {
            "name": "Naniarchar",
            "name_bn": "নানিয়ারচর"
          }
        ]
      },
      {
        "name": "Noakhali",
        "name_bn": "নোয়াখালী",
        "upazilas": [
          {
            "name": "Noakhali Sadar",
            "name_bn": "নোয়াখালী সদর"
          },
          {
            "name": "Companiganj",
            "name_bn": "কোম্পানীগঞ্জ"
          },
          {
            "name": "Begumganj",
            "name_bn": "বেগমগঞ্জ"
          },
          {
            "name": "Hatia",
            "name_bn": "হাতিয়া"
          },
          {
            "name": "Subarnachar",
            "name_bn": "সুবর্ণচর"
          },
          {
            "name": "Kabirhat",
            "name_bn": "কবিরহাট"
          },
          {
            "name": "Senbug",
            "name_bn": "সেনবাগ"
          },
          {
            "name": "Chatkhil",
            "name_bn": "চাটখিল"
          },
          {
            "name": "Sonaimori",
            "name_bn": "সোনাইমুড়ী"
          }
        ]
      },
      {
        "name": "Chandpur",
        "name_bn": "চাঁদপুর",
        "upazilas": [
          {
            "name": "Haimchar",
            "name_bn": "হাইমচর"
          },
          {
            "name": "Kachua",
            "name_bn": "কচুয়া"
          },
          {
            "name": "Shahrasti",
            "name_bn": "শাহরাস্তি\t"
          },
          {
            "name": "Chandpur Sadar",
            "name_bn": "চাঁদপুর সদর"
          },
          {
            "name": "Matlab South",
            "name_bn": "মতলব দক্ষিণ"
          },
          {
            "name": "Hajiganj",
            "name_bn": "হাজীগঞ্জ"
          },
          {
            "name": "Matlab North",
            "name_bn": "মতলব উত্তর"
          },
          {
            "name": "Faridgonj",
            "name_bn": "ফরিদগঞ্জ"
          }
        ]
      },
      {
        "name": "Lakshmipur",
        "name_bn": "লক্ষ্মীপুর",
        "upazilas": [
          {
            "name": "Lakshmipur Sadar",
            "name_bn": "লক্ষ্মীপুর সদর"
          },
          {
            "name": "Kamalnagar",
            "name_bn": "কমলনগর"
          },
          {
            "name": "Raipur",
            "name_bn": "রায়পুর"
          },
          {
            "name": "Ramgati",
            "name_bn": "রামগতি"
          },
          {
            "name": "Ramganj",
            "name_bn": "রামগঞ্জ"
          }
        ]
      },
      {
        "name": "Chattogram",
        "name_bn": "চট্টগ্রাম",
        "upazilas": [
          {
            "name": "Rangunia",
            "name_bn": "রাঙ্গুনিয়া"
          },
          {
            "name": "Sitakunda",
            "name_bn": "সীতাকুন্ড"
          },
          {
            "name": "Mirsharai",
            "name_bn": "মীরসরাই"
          },
          {
            "name": "Patiya",
            "name_bn": "পটিয়া"
          },
          {
            "name": "Sandwip",
            "name_bn": "সন্দ্বীপ"
          },
          {
            "name": "Banshkhali",
            "name_bn": "বাঁশখালী"
          },
          {
            "name": "Boalkhali",
            "name_bn": "বোয়ালখালী"
          },
          {
            "name": "Anwara",
            "name_bn": "আনোয়ারা"
          },
          {
            "name": "Chandanaish",
            "name_bn": "চন্দনাইশ"
          },
          {
            "name": "Satkania",
            "name_bn": "সাতকানিয়া"
          },
          {
            "name": "Lohagara",
            "name_bn": "লোহাগাড়া"
          },
          {
            "name": "Hathazari",
            "name_bn": "হাটহাজারী"
          },
          {
            "name": "Fatikchhari",
            "name_bn": "ফটিকছড়ি"
          },
          {
            "name": "Raozan",
            "name_bn": "রাউজান"
          },
          {
            "name": "Karnafuli",
            "name_bn": "কর্ণফুলী"
          }
        ]
      },
      {
        "name": "Coxsbazar",
        "name_bn": "কক্সবাজার",
        "upazilas": [
          {
            "name": "Coxsbazar Sadar",
            "name_bn": "কক্সবাজার সদর"
          },
          {
            "name": "Chakaria",
            "name_bn": "চকরিয়া"
          },
          {
            "name": "Kutubdia",
            "name_bn": "কুতুবদিয়া"
          },
          {
            "name": "Ukhiya",
            "name_bn": "উখিয়া"
          },
          {
            "name": "Moheshkhali",
            "name_bn": "মহেশখালী"
          },
          {
            "name": "Pekua",
            "name_bn": "পেকুয়া"
          },
          {
            "name": "Ramu",
            "name_bn": "রামু"
          },
          {
            "name": "Teknaf",
            "name_bn": "টেকনাফ"
          },
          {
            "name": "Eidgaon",
            "name_bn": "ঈদগাঁও"
          }
        ]
      },
      {
        "name": "Khagrachhari",
        "name_bn": "খাগড়াছড়ি",
        "upazilas": [
          {
            "name": "Khagrachhari Sadar",
            "name_bn": "খাগড়াছড়ি সদর"
          },
          {
            "name": "Dighinala",
            "name_bn": "দিঘীনালা"
          },
          {
            "name": "Panchari",
            "name_bn": "পানছড়ি"
          },
          {
            "name": "Laxmichhari",
            "name_bn": "লক্ষীছড়ি"
          },
          {
            "name": "Mohalchari",
            "name_bn": "মহালছড়ি"
          },
          {
            "name": "Manikchari",
            "name_bn": "মানিকছড়ি"
          },
          {
            "name": "Ramgarh",
            "name_bn": "রামগড়"
          },
          {
            "name": "Matiranga",
            "name_bn": "মাটিরাঙ্গা"
          },
          {
            "name": "Guimara",
            "name_bn": "গুইমারা"
          }
        ]
      },
      {
        "name": "Bandarban",
        "name_bn": "বান্দরবান",
        "upazilas": [
          {
            "name": "Bandarban Sadar",
            "name_bn": "বান্দরবান সদর"
          },
          {
            "name": "Alikadam",
            "name_bn": "আলীকদম"
          },
          {
            "name": "Naikhongchhari",
            "name_bn": "নাইক্ষ্যংছড়ি"
          },
          {
            "name": "Rowangchhari",
            "name_bn": "রোয়াংছড়ি"
          },
          {
            "name": "Lama",
            "name_bn": "লামা"
          },
          {
            "name": "Ruma",
            "name_bn": "রুমা"
          },
          {
            "name": "Thanchi",
            "name_bn": "থানচি"
          }
        ]
      }
    ]
  },
  {
    "name": "Rajshahi",
    "name_bn": "রাজশাহী",
    "districts": [
      {
        "name": "Sirajganj",
        "name_bn": "সিরাজগঞ্জ",
        "upazilas": [
          {
            "name": "Belkuchi",
            "name_bn": "বেলকুচি"
          },
          {
            "name": "Chauhali",
            "name_bn": "চৌহালি"
          },
          {
            "name": "Kamarkhand",
            "name_bn": "কামারখন্দ"
          },
          {
            "name": "Kazipur",
            "name_bn": "কাজীপুর"
          },
          {
            "name": "Raigonj",
            "name_bn": "রায়গঞ্জ"
          },
          {
            "name": "Shahjadpur",
            "name_bn": "শাহজাদপুর"
          },
          {
            "name": "Sirajganj Sadar",
            "name_bn": "সিরাজগঞ্জ সদর"
          },
          {
            "name": "Tarash",
            "name_bn": "তাড়াশ"
          },
          {
            "name": "Ullapara",
            "name_bn": "উল্লাপাড়া"
          }
        ]
      },
      {
        "name": "Pabna",
        "name_bn": "পাবনা",
        "upazilas": [
          {
            "name": "Sujanagar",
            "name_bn": "সুজানগর"
          },
          {
            "name": "Ishurdi",
            "name_bn": "ঈশ্বরদী"
          },
          {
            "name": "Bhangura",
            "name_bn": "ভাঙ্গুড়া"
          },
          {
            "name": "Pabna Sadar",
            "name_bn": "পাবনা সদর"
          },
          {
            "name": "Bera",
            "name_bn": "বেড়া"
          },
          {
            "name": "Atghoria",
            "name_bn": "আটঘরিয়া"
          },
          {
            "name": "Chatmohar",
            "name_bn": "চাটমোহর"
          },
          {
            "name": "Santhia",
            "name_bn": "সাঁথিয়া"
          },
          {
            "name": "Faridpur",
            "name_bn": "ফরিদপুর"
          }
        ]
      },
      {
        "name": "Bogura",
        "name_bn": "বগুড়া",
        "upazilas": [
          {
            "name": "Kahaloo",
            "name_bn": "কাহালু"
          },
          {
            "name": "Bogra Sadar",
            "name_bn": "বগুড়া সদর"
          },
          {
            "name": "Shariakandi",
            "name_bn": "সারিয়াকান্দি"
          },
          {
            "name": "Shajahanpur",
            "name_bn": "শাজাহানপুর"
          },
          {
            "name": "Dupchanchia",
            "name_bn": "দুপচাচিঁয়া"
          },
          {
            "name": "Adamdighi",
            "name_bn": "আদমদিঘি"
          },
          {
            "name": "Nondigram",
            "name_bn": "নন্দিগ্রাম"
          },
          {
            "name": "Sonatala",
            "name_bn": "সোনাতলা"
          },
          {
            "name": "Dhunot",
            "name_bn": "ধুনট"
          },
          {
            "name": "Gabtali",
            "name_bn": "গাবতলী"
          },
          {
            "name": "Sherpur",
            "name_bn": "শেরপুর"
          },
          {
            "name": "Shibganj",
            "name_bn": "শিবগঞ্জ"
          }
        ]
      },
      {
        "name": "Rajshahi",
        "name_bn": "রাজশাহী",
        "upazilas": [
          {
            "name": "Paba",
            "name_bn": "পবা"
          },
          {
            "name": "Durgapur",
            "name_bn": "দুর্গাপুর"
          },
          {
            "name": "Mohonpur",
            "name_bn": "মোহনপুর"
          },
          {
            "name": "Charghat",
            "name_bn": "চারঘাট"
          },
          {
            "name": "Puthia",
            "name_bn": "পুঠিয়া"
          },
          {
            "name": "Bagha",
            "name_bn": "বাঘা"
          },
          {
            "name": "Godagari",
            "name_bn": "গোদাগাড়ী"
          },
          {
            "name": "Tanore",
            "name_bn": "তানোর"
          },
          {
            "name": "Bagmara",
            "name_bn": "বাগমারা"
          }
        ]
      },
      {
        "name": "Natore",
        "name_bn": "নাটোর",
        "upazilas": [
          {
            "name": "Natore Sadar",
            "name_bn": "নাটোর সদর"
          },
          {
            "name": "Singra",
            "name_bn": "সিংড়া"
          },
          {
            "name": "Baraigram",
            "name_bn": "বড়াইগ্রাম"
          },
          {
            "name": "Bagatipara",
            "name_bn": "বাগাতিপাড়া"
          },
          {
            "name": "Lalpur",
            "name_bn": "লালপুর"
          },
          {
            "name": "Gurudaspur",
            "name_bn": "গুরুদাসপুর"
          },
          {
            "name": "Naldanga",
            "name_bn": "নলডাঙ্গা"
          }
        ]
      },
      {
        "name": "Joypurhat",
        "name_bn": "জয়পুরহাট",
        "upazilas": [
          {
            "name": "Akkelpur",
            "name_bn": "আক্কেলপুর"
          },
          {
            "name": "Kalai",
            "name_bn": "কালাই"
          },
          {
            "name": "Khetlal",
            "name_bn": "ক্ষেতলাল"
          },
          {
            "name": "Panchbibi",
            "name_bn": "পাঁচবিবি"
          },
          {
            "name": "Joypurhat Sadar",
            "name_bn": "জয়পুরহাট সদর"
          }
        ]
      },
      {
        "name": "Chapainawabganj",
        "name_bn": "চাঁপাইনবাবগঞ্জ",
        "upazilas": [
          {
            "name": "Chapainawabganj Sadar",
            "name_bn": "চাঁপাইনবাবগঞ্জ সদর"
          },
          {
            "name": "Gomostapur",
            "name_bn": "গোমস্তাপুর"
          },
          {
            "name": "Nachol",
            "name_bn": "নাচোল"
          },
          {
            "name": "Bholahat",
            "name_bn": "ভোলাহাট"
          },
          {
            "name": "Shibganj",
            "name_bn": "শিবগঞ্জ"
          }
        ]
      },
      {
        "name": "Naogaon",
        "name_bn": "নওগাঁ",
        "upazilas": [
          {
            "name": "Mohadevpur",
            "name_bn": "মহাদেবপুর"
          },
          {
            "name": "Badalgachi",
            "name_bn": "বদলগাছী"
          },
          {
            "name": "Patnitala",
            "name_bn": "পত্নিতলা"
          },
          {
            "name": "Dhamoirhat",
            "name_bn": "ধামইরহাট"
          },
          {
            "name": "Niamatpur",
            "name_bn": "নিয়ামতপুর"
          },
          {
            "name": "Manda",
            "name_bn": "মান্দা"
          },
          {
            "name": "Atrai",
            "name_bn": "আত্রাই"
          },
          {
            "name": "Raninagar",
            "name_bn": "রাণীনগর"
          },
          {
            "name": "Naogaon Sadar",
            "name_bn": "নওগাঁ সদর"
          },
          {
            "name": "Porsha",
            "name_bn": "পোরশা"
          },
          {
            "name": "Sapahar",
            "name_bn": "সাপাহার"
          }
        ]
      }
    ]
  },
  {
    "name": "Khulna",
    "name_bn": "খুলনা",
    "districts": [
      {
        "name": "Jashore",
        "name_bn": "যশোর",
        "upazilas": [
          {
            "name": "Manirampur",
            "name_bn": "মণিরামপুর"
          },
          {
            "name": "Abhaynagar",
            "name_bn": "অভয়নগর"
          },
          {
            "name": "Bagherpara",
            "name_bn": "বাঘারপাড়া"
          },
          {
            "name": "Chougachha",
            "name_bn": "চৌগাছা"
          },
          {
            "name": "Jhikargacha",
            "name_bn": "ঝিকরগাছা"
          },
          {
            "name": "Keshabpur",
            "name_bn": "কেশবপুর"
          },
          {
            "name": "Jessore Sadar",
            "name_bn": "যশোর সদর"
          },
          {
            "name": "Sharsha",
            "name_bn": "শার্শা"
          }
        ]
      },
      {
        "name": "Satkhira",
        "name_bn": "সাতক্ষীরা",
        "upazilas": [
          {
            "name": "Assasuni",
            "name_bn": "আশাশুনি"
          },
          {
            "name": "Debhata",
            "name_bn": "দেবহাটা"
          },
          {
            "name": "Kalaroa",
            "name_bn": "কলারোয়া"
          },
          {
            "name": "Satkhira Sadar",
            "name_bn": "সাতক্ষীরা সদর"
          },
          {
            "name": "Shyamnagar",
            "name_bn": "শ্যামনগর"
          },
          {
            "name": "Tala",
            "name_bn": "তালা"
          },
          {
            "name": "Kaliganj",
            "name_bn": "কালিগঞ্জ"
          }
        ]
      },
      {
        "name": "Meherpur",
        "name_bn": "মেহেরপুর",
        "upazilas": [
          {
            "name": "Mujibnagar",
            "name_bn": "মুজিবনগর"
          },
          {
            "name": "Meherpur Sadar",
            "name_bn": "মেহেরপুর সদর"
          },
          {
            "name": "Gangni",
            "name_bn": "গাংনী"
          }
        ]
      },
      {
        "name": "Narail",
        "name_bn": "নড়াইল",
        "upazilas": [
          {
            "name": "Narail Sadar",
            "name_bn": "নড়াইল সদর"
          },
          {
            "name": "Lohagara",
            "name_bn": "লোহাগড়া"
          },
          {
            "name": "Kalia",
            "name_bn": "কালিয়া"
          }
        ]
      },
      {
        "name": "Chuadanga",
        "name_bn": "চুয়াডাঙ্গা",
        "upazilas": [
          {
            "name": "Chuadanga Sadar",
            "name_bn": "চুয়াডাঙ্গা সদর"
          },
          {
            "name": "Alamdanga",
            "name_bn": "আলমডাঙ্গা"
          },
          {
            "name": "Damurhuda",
            "name_bn": "দামুড়হুদা"
          },
          {
            "name": "Jibannagar",
            "name_bn": "জীবননগর"
          }
        ]
      },
      {
        "name": "Kushtia",
        "name_bn": "কুষ্টিয়া",
        "upazilas": [
          {
            "name": "Kushtia Sadar",
            "name_bn": "কুষ্টিয়া সদর"
          },
          {
            "name": "Kumarkhali",
            "name_bn": "কুমারখালী"
          },
          {
            "name": "Khoksa",
            "name_bn": "খোকসা"
          },
          {
            "name": "Mirpur",
            "name_bn": "মিরপুর"
          },
          {
            "name": "Daulatpur",
            "name_bn": "দৌলতপুর"
          },
          {
            "name": "Bheramara",
            "name_bn": "ভেড়ামারা"
          }
        ]
      },
      {
        "name": "Magura",
        "name_bn": "মাগুরা",
        "upazilas": [
          {
            "name": "Shalikha",
            "name_bn": "শালিখা"
          },
          {
            "name": "Sreepur",
            "name_bn": "শ্রীপুর"
          },
          {
            "name": "Magura Sadar",
            "name_bn": "মাগুরা সদর"
          },
          {
            "name": "Mohammadpur",
            "name_bn": "মহম্মদপুর"
          }
        ]
      },
      {
        "name": "Khulna",
        "name_bn": "খুলনা",
        "upazilas": [
          {
            "name": "Paikgasa",
            "name_bn": "পাইকগাছা"
          },
          {
            "name": "Fultola",
            "name_bn": "ফুলতলা"
          },
          {
            "name": "Digholia",
            "name_bn": "দিঘলিয়া"
          },
          {
            "name": "Rupsha",
            "name_bn": "রূপসা"
          },
          {
            "name": "Terokhada",
            "name_bn": "তেরখাদা"
          },
          {
            "name": "Dumuria",
            "name_bn": "ডুমুরিয়া"
          },
          {
            "name": "Botiaghata",
            "name_bn": "বটিয়াঘাটা"
          },
          {
            "name": "Dakop",
            "name_bn": "দাকোপ"
          },
          {
            "name": "Koyra",
            "name_bn": "কয়রা"
          }
        ]
      },
      {
        "name": "Bagerhat",
        "name_bn": "বাগেরহাট",
        "upazilas": [
          {
            "name": "Fakirhat",
            "name_bn": "ফকিরহাট"
          },
          {
            "name": "Bagerhat Sadar",
            "name_bn": "বাগেরহাট সদর"
          },
          {
            "name": "Mollahat",
            "name_bn": "মোল্লাহাট"
          },
          {
            "name": "Sarankhola",
            "name_bn": "শরণখোলা"
          },
          {
            "name": "Rampal",
            "name_bn": "রামপাল"
          },
          {
            "name": "Morrelganj",
            "name_bn": "মোড়েলগঞ্জ"
          },
          {
            "name": "Kachua",
            "name_bn": "কচুয়া"
          },
          {
            "name": "Mongla",
            "name_bn": "মোংলা"
          },
          {
            "name": "Chitalmari",
            "name_bn": "চিতলমারী"
          }
        ]
      },
      {
        "name": "Jhenaidah",
        "name_bn": "ঝিনাইদহ",
        "upazilas": [
          {
            "name": "Jhenaidah Sadar",
            "name_bn": "ঝিনাইদহ সদর"
          },
          {
            "name": "Shailkupa",
            "name_bn": "শৈলকুপা"
          },
          {
            "name": "Harinakundu",
            "name_bn": "হরিণাকুন্ডু"
          },
          {
            "name": "Kaliganj",
            "name_bn": "কালীগঞ্জ"
          },
          {
            "name": "Kotchandpur",
            "name_bn": "কোটচাঁদপুর"
          },
          {
            "name": "Moheshpur",
            "name_bn": "মহেশপুর"
          }
        ]
      }
    ]
  },
  {
    "name": "Barisal",
    "name_bn": "বরিশাল",
    "districts": [
      {
        "name": "Jhalakathi",
        "name_bn": "ঝালকাঠি",
        "upazilas": [
          {
            "name": "Jhalakathi Sadar",
            "name_bn": "ঝালকাঠি সদর"
          },
          {
            "name": "Kathalia",
            "name_bn": "কাঠালিয়া"
          },
          {
            "name": "Nalchity",
            "name_bn": "নলছিটি"
          },
          {
            "name": "Rajapur",
            "name_bn": "রাজাপুর"
          }
        ]
      },
      {
        "name": "Patuakhali",
        "name_bn": "পটুয়াখালী",
        "upazilas": [
          {
            "name": "Bauphal",
            "name_bn": "বাউফল"
          },
          {
            "name": "Patuakhali Sadar",
            "name_bn": "পটুয়াখালী সদর"
          },
          {
            "name": "Dumki",
            "name_bn": "দুমকি"
          },
          {
            "name": "Dashmina",
            "name_bn": "দশমিনা"
          },
          {
            "name": "Kalapara",
            "name_bn": "কলাপাড়া"
          },
          {
            "name": "Mirzaganj",
            "name_bn": "মির্জাগঞ্জ"
          },
          {
            "name": "Galachipa",
            "name_bn": "গলাচিপা"
          },
          {
            "name": "Rangabali",
            "name_bn": "রাঙ্গাবালী"
          }
        ]
      },
      {
        "name": "Pirojpur",
        "name_bn": "পিরোজপুর",
        "upazilas": [
          {
            "name": "Pirojpur Sadar",
            "name_bn": "পিরোজপুর সদর"
          },
          {
            "name": "Nazirpur",
            "name_bn": "নাজিরপুর"
          },
          {
            "name": "Kawkhali",
            "name_bn": "কাউখালী"
          },
          {
            "name": "Zianagar",
            "name_bn": "জিয়ানগর"
          },
          {
            "name": "Bhandaria",
            "name_bn": "ভান্ডারিয়া"
          },
          {
            "name": "Mathbaria",
            "name_bn": "মঠবাড়ীয়া"
          },
          {
            "name": "Nesarabad",
            "name_bn": "নেছারাবাদ"
          }
        ]
      },
      {
        "name": "Barisal",
        "name_bn": "বরিশাল",
        "upazilas": [
          {
            "name": "Barisal Sadar",
            "name_bn": "বরিশাল সদর"
          },
          {
            "name": "Bakerganj",
            "name_bn": "বাকেরগঞ্জ"
          },
          {
            "name": "Babuganj",
            "name_bn": "বাবুগঞ্জ"
          },
          {
            "name": "Wazirpur",
            "name_bn": "উজিরপুর"
          },
          {
            "name": "Banaripara",
            "name_bn": "বানারীপাড়া"
          },
          {
            "name": "Gournadi",
            "name_bn": "গৌরনদী"
          },
          {
            "name": "Agailjhara",
            "name_bn": "আগৈলঝাড়া"
          },
          {
            "name": "Mehendiganj",
            "name_bn": "মেহেন্দিগঞ্জ"
          },
          {
            "name": "Muladi",
            "name_bn": "মুলাদী"
          },
          {
            "name": "Hizla",
            "name_bn": "হিজলা"
          }
        ]
      },
      {
        "name": "Bhola",
        "name_bn": "ভোলা",
        "upazilas": [
          {
            "name": "Bhola Sadar",
            "name_bn": "ভোলা সদর"
          },
          {
            "name": "Borhan Sddin",
            "name_bn": "বোরহান উদ্দিন"
          },
          {
            "name": "Charfesson",
            "name_bn": "চরফ্যাশন"
          },
          {
            "name": "Doulatkhan",
            "name_bn": "দৌলতখান"
          },
          {
            "name": "Monpura",
            "name_bn": "মনপুরা"
          },
          {
            "name": "Tazumuddin",
            "name_bn": "তজুমদ্দিন"
          },
          {
            "name": "Lalmohan",
            "name_bn": "লালমোহন"
          }
        ]
      },
      {
        "name": "Barguna",
        "name_bn": "বরগুনা",
        "upazilas": [
          {
            "name": "Amtali",
            "name_bn": "আমতলী"
          },
          {
            "name": "Barguna Sadar",
            "name_bn": "বরগুনা সদর"
          },
          {
            "name": "Betagi",
            "name_bn": "বেতাগী"
          },
          {
            "name": "Bamna",
            "name_bn": "বামনা"
          },
          {
            "name": "Pathorghata",
            "name_bn": "পাথরঘাটা"
          },
          {
            "name": "Taltali",
            "name_bn": "তালতলি"
          }
        ]
      }
    ]
  },
  {
    "name": "Sylhet",
    "name_bn": "সিলেট",
    "districts": [
      {
        "name": "Sylhet",
        "name_bn": "সিলেট",
        "upazilas": [
          {
            "name": "Balaganj",
            "name_bn": "বালাগঞ্জ"
          },
          {
            "name": "Beanibazar",
            "name_bn": "বিয়ানীবাজার"
          },
          {
            "name": "Bishwanath",
            "name_bn": "বিশ্বনাথ"
          },
          {
            "name": "Companiganj",
            "name_bn": "কোম্পানীগঞ্জ"
          },
          {
            "name": "Fenchuganj",
            "name_bn": "ফেঞ্চুগঞ্জ"
          },
          {
            "name": "Golapganj",
            "name_bn": "গোলাপগঞ্জ"
          },
          {
            "name": "Gowainghat",
            "name_bn": "গোয়াইনঘাট"
          },
          {
            "name": "Jaintiapur",
            "name_bn": "জৈন্তাপুর"
          },
          {
            "name": "Kanaighat",
            "name_bn": "কানাইঘাট"
          },
          {
            "name": "Sylhet Sadar",
            "name_bn": "সিলেট সদর"
          },
          {
            "name": "Zakiganj",
            "name_bn": "জকিগঞ্জ"
          },
          {
            "name": "Dakshinsurma",
            "name_bn": "দক্ষিণ সুরমা"
          },
          {
            "name": "Osmaninagar",
            "name_bn": "ওসমানী নগর"
          }
        ]
      },
      {
        "name": "Moulvibazar",
        "name_bn": "মৌলভীবাজার",
        "upazilas": [
          {
            "name": "Barlekha",
            "name_bn": "বড়লেখা"
          },
          {
            "name": "Kamolganj",
            "name_bn": "কমলগঞ্জ"
          },
          {
            "name": "Kulaura",
            "name_bn": "কুলাউড়া"
          },
          {
            "name": "Moulvibazar Sadar",
            "name_bn": "মৌলভীবাজার সদর"
          },
          {
            "name": "Rajnagar",
            "name_bn": "রাজনগর"
          },
          {
            "name": "Sreemangal",
            "name_bn": "শ্রীমঙ্গল"
          },
          {
            "name": "Juri",
            "name_bn": "জুড়ী"
          }
        ]
      },
      {
        "name": "Habiganj",
        "name_bn": "হবিগঞ্জ",
        "upazilas": [
          {
            "name": "Nabiganj",
            "name_bn": "নবীগঞ্জ"
          },
          {
            "name": "Bahubal",
            "name_bn": "বাহুবল"
          },
          {
            "name": "Ajmiriganj",
            "name_bn": "আজমিরীগঞ্জ"
          },
          {
            "name": "Baniachong",
            "name_bn": "বানিয়াচং"
          },
          {
            "name": "Lakhai",
            "name_bn": "লাখাই"
          },
          {
            "name": "Chunarughat",
            "name_bn": "চুনারুঘাট"
          },
          {
            "name": "Habiganj Sadar",
            "name_bn": "হবিগঞ্জ সদর"
          },
          {
            "name": "Madhabpur",
            "name_bn": "মাধবপুর"
          }
        ]
      },
      {
        "name": "Sunamganj",
        "name_bn": "সুনামগঞ্জ",
        "upazilas": [
          {
            "name": "Sunamganj Sadar",
            "name_bn": "সুনামগঞ্জ সদর"
          },
          {
            "name": "South Sunamganj",
            "name_bn": "দক্ষিণ সুনামগঞ্জ"
          },
          {
            "name": "Bishwambarpur",
            "name_bn": "বিশ্বম্ভরপুর"
          },
          {
            "name": "Chhatak",
            "name_bn": "ছাতক"
          },
          {
            "name": "Jagannathpur",
            "name_bn": "জগন্নাথপুর"
          },
          {
            "name": "Dowarabazar",
            "name_bn": "দোয়ারাবাজার"
          },
          {
            "name": "Tahirpur",
            "name_bn": "তাহিরপুর"
          },
          {
            "name": "Dharmapasha",
            "name_bn": "ধর্মপাশা"
          },
          {
            "name": "Jamalganj",
            "name_bn": "জামালগঞ্জ"
          },
          {
            "name": "Shalla",
            "name_bn": "শাল্লা"
          },
          {
            "name": "Derai",
            "name_bn": "দিরাই"
          },
          {
            "name": "Madhyanagar",
            "name_bn": "মধ্যনগর"
          }
        ]
      }
    ]
  },
  {
    "name": "Dhaka",
    "name_bn": "ঢাকা",
    "districts": [
      {
        "name": "Narsingdi",
        "name_bn": "নরসিংদী",
        "upazilas": [
          {
            "name": "Belabo",
            "name_bn": "বেলাবো"
          },
          {
            "name": "Monohardi",
            "name_bn": "মনোহরদী"
          },
          {
            "name": "Narsingdi Sadar",
            "name_bn": "নরসিংদী সদর"
          },
          {
            "name": "Palash",
            "name_bn": "পলাশ"
          },
          {
            "name": "Raipura",
            "name_bn": "রায়পুরা"
          },
          {
            "name": "Shibpur",
            "name_bn": "শিবপুর"
          }
        ]
      },
      {
        "name": "Gazipur",
        "name_bn": "গাজীপুর",
        "upazilas": [
          {
            "name": "Kaliganj",
            "name_bn": "কালীগঞ্জ"
          },
          {
            "name": "Kaliakair",
            "name_bn": "কালিয়াকৈর"
          },
          {
            "name": "Kapasia",
            "name_bn": "কাপাসিয়া"
          },
          {
            "name": "Gazipur Sadar",
            "name_bn": "গাজীপুর সদর"
          },
          {
            "name": "Sreepur",
            "name_bn": "শ্রীপুর"
          }
        ]
      },
      {
        "name": "Shariatpur",
        "name_bn": "শরীয়তপুর",
        "upazilas": [
          {
            "name": "Shariatpur Sadar",
            "name_bn": "শরিয়তপুর সদর"
          },
          {
            "name": "Naria",
            "name_bn": "নড়িয়া"
          },
          {
            "name": "Zajira",
            "name_bn": "জাজিরা"
          },
          {
            "name": "Gosairhat",
            "name_bn": "গোসাইরহাট"
          },
          {
            "name": "Bhedarganj",
            "name_bn": "ভেদরগঞ্জ"
          },
          {
            "name": "Damudya",
            "name_bn": "ডামুড্যা"
          }
        ]
      },
      {
        "name": "Narayanganj",
        "name_bn": "নারায়ণগঞ্জ",
        "upazilas": [
          {
            "name": "Araihazar",
            "name_bn": "আড়াইহাজার"
          },
          {
            "name": "Bandar",
            "name_bn": "বন্দর"
          },
          {
            "name": "Narayanganj Sadar",
            "name_bn": "নারায়নগঞ্জ সদর"
          },
          {
            "name": "Rupganj",
            "name_bn": "রূপগঞ্জ"
          },
          {
            "name": "Sonargaon",
            "name_bn": "সোনারগাঁ"
          }
        ]
      },
      {
        "name": "Tangail",
        "name_bn": "টাঙ্গাইল",
        "upazilas": [
          {
            "name": "Basail",
            "name_bn": "বাসাইল"
          },
          {
            "name": "Bhuapur",
            "name_bn": "ভুয়াপুর"
          },
          {
            "name": "Delduar",
            "name_bn": "দেলদুয়ার"
          },
          {
            "name": "Ghatail",
            "name_bn": "ঘাটাইল"
          },
          {
            "name": "Gopalpur",
            "name_bn": "গোপালপুর"
          },
          {
            "name": "Madhupur",
            "name_bn": "মধুপুর"
          },
          {
            "name": "Mirzapur",
            "name_bn": "মির্জাপুর"
          },
          {
            "name": "Nagarpur",
            "name_bn": "নাগরপুর"
          },
          {
            "name": "Sakhipur",
            "name_bn": "সখিপুর"
          },
          {
            "name": "Tangail Sadar",
            "name_bn": "টাঙ্গাইল সদর"
          },
          {
            "name": "Kalihati",
            "name_bn": "কালিহাতী"
          },
          {
            "name": "Dhanbari",
            "name_bn": "ধনবাড়ী"
          }
        ]
      },
      {
        "name": "Kishoreganj",
        "name_bn": "কিশোরগঞ্জ",
        "upazilas": [
          {
            "name": "Itna",
            "name_bn": "ইটনা"
          },
          {
            "name": "Katiadi",
            "name_bn": "কটিয়াদী"
          },
          {
            "name": "Bhairab",
            "name_bn": "ভৈরব"
          },
          {
            "name": "Tarail",
            "name_bn": "তাড়াইল"
          },
          {
            "name": "Hossainpur",
            "name_bn": "হোসেনপুর"
          },
          {
            "name": "Pakundia",
            "name_bn": "পাকুন্দিয়া"
          },
          {
            "name": "Kuliarchar",
            "name_bn": "কুলিয়ারচর"
          },
          {
            "name": "Kishoreganj Sadar",
            "name_bn": "কিশোরগঞ্জ সদর"
          },
          {
            "name": "Karimgonj",
            "name_bn": "করিমগঞ্জ"
          },
          {
            "name": "Bajitpur",
            "name_bn": "বাজিতপুর"
          },
          {
            "name": "Austagram",
            "name_bn": "অষ্টগ্রাম"
          },
          {
            "name": "Mithamoin",
            "name_bn": "মিঠামইন"
          },
          {
            "name": "Nikli",
            "name_bn": "নিকলী"
          }
        ]
      },
      {
        "name": "Manikganj",
        "name_bn": "মানিকগঞ্জ",
        "upazilas": [
          {
            "name": "Harirampur",
            "name_bn": "হরিরামপুর"
          },
          {
            "name": "Saturia",
            "name_bn": "সাটুরিয়া"
          },
          {
            "name": "Manikganj Sadar",
            "name_bn": "মানিকগঞ্জ সদর"
          },
          {
            "name": "Gior",
            "name_bn": "ঘিওর"
          },
          {
            "name": "Shibaloy",
            "name_bn": "শিবালয়"
          },
          {
            "name": "Doulatpur",
            "name_bn": "দৌলতপুর"
          },
          {
            "name": "Singiar",
            "name_bn": "সিংগাইর"
          }
        ]
      },
      {
        "name": "Dhaka",
        "name_bn": "ঢাকা",
        "upazilas": [
          {
            "name": "Savar",
            "name_bn": "সাভার"
          },
          {
            "name": "Dhamrai",
            "name_bn": "ধামরাই"
          },
          {
            "name": "Keraniganj",
            "name_bn": "কেরাণীগঞ্জ"
          },
          {
            "name": "Nawabganj",
            "name_bn": "নবাবগঞ্জ"
          },
          {
            "name": "Dohar",
            "name_bn": "দোহার"
          }
        ]
      },
      {
        "name": "Munshiganj",
        "name_bn": "মুন্সিগঞ্জ",
        "upazilas": [
          {
            "name": "Munshiganj Sadar",
            "name_bn": "মুন্সিগঞ্জ সদর"
          },
          {
            "name": "Sreenagar",
            "name_bn": "শ্রীনগর"
          },
          {
            "name": "Sirajdikhan",
            "name_bn": "সিরাজদিখান"
          },
          {
            "name": "Louhajanj",
            "name_bn": "লৌহজং"
          },
          {
            "name": "Gajaria",
            "name_bn": "গজারিয়া"
          },
          {
            "name": "Tongibari",
            "name_bn": "টংগীবাড়ি"
          }
        ]
      },
      {
        "name": "Rajbari",
        "name_bn": "রাজবাড়ী",
        "upazilas": [
          {
            "name": "Rajbari Sadar",
            "name_bn": "রাজবাড়ী সদর"
          },
          {
            "name": "Goalanda",
            "name_bn": "গোয়ালন্দ"
          },
          {
            "name": "Pangsa",
            "name_bn": "পাংশা"
          },
          {
            "name": "Baliakandi",
            "name_bn": "বালিয়াকান্দি"
          },
          {
            "name": "Kalukhali",
            "name_bn": "কালুখালী"
          }
        ]
      },
      {
        "name": "Madaripur",
        "name_bn": "মাদারীপুর",
        "upazilas": [
          {
            "name": "Madaripur Sadar",
            "name_bn": "মাদারীপুর সদর"
          },
          {
            "name": "Shibchar",
            "name_bn": "শিবচর"
          },
          {
            "name": "Kalkini",
            "name_bn": "কালকিনি"
          },
          {
            "name": "Rajoir",
            "name_bn": "রাজৈর"
          },
          {
            "name": "Dasar",
            "name_bn": "ডাসার"
          }
        ]
      },
      {
        "name": "Gopalganj",
        "name_bn": "গোপালগঞ্জ",
        "upazilas": [
          {
            "name": "Gopalganj Sadar",
            "name_bn": "গোপালগঞ্জ সদর"
          },
          {
            "name": "Kashiani",
            "name_bn": "কাশিয়ানী"
          },
          {
            "name": "Tungipara",
            "name_bn": "টুংগীপাড়া"
          },
          {
            "name": "Kotalipara",
            "name_bn": "কোটালীপাড়া"
          },
          {
            "name": "Muksudpur",
            "name_bn": "মুকসুদপুর"
          }
        ]
      },
      {
        "name": "Faridpur",
        "name_bn": "ফরিদপুর",
        "upazilas": [
          {
            "name": "Faridpur Sadar",
            "name_bn": "ফরিদপুর সদর"
          },
          {
            "name": "Alfadanga",
            "name_bn": "আলফাডাঙ্গা"
          },
          {
            "name": "Boalmari",
            "name_bn": "বোয়ালমারী"
          },
          {
            "name": "Sadarpur",
            "name_bn": "সদরপুর"
          },
          {
            "name": "Nagarkanda",
            "name_bn": "নগরকান্দা"
          },
          {
            "name": "Bhanga",
            "name_bn": "ভাঙ্গা"
          },
          {
            "name": "Charbhadrasan",
            "name_bn": "চরভদ্রাসন"
          },
          {
            "name": "Madhukhali",
            "name_bn": "মধুখালী"
          },
          {
            "name": "Saltha",
            "name_bn": "সালথা"
          }
        ]
      }
    ]
  },
  {
    "name": "Rangpur",
    "name_bn": "রংপুর",
    "districts": [
      {
        "name": "Panchagarh",
        "name_bn": "পঞ্চগড়",
        "upazilas": [
          {
            "name": "Panchagarh Sadar",
            "name_bn": "পঞ্চগড় সদর"
          },
          {
            "name": "Debiganj",
            "name_bn": "দেবীগঞ্জ"
          },
          {
            "name": "Boda",
            "name_bn": "বোদা"
          },
          {
            "name": "Atwari",
            "name_bn": "আটোয়ারী"
          },
          {
            "name": "Tetulia",
            "name_bn": "তেতুলিয়া"
          }
        ]
      },
      {
        "name": "Dinajpur",
        "name_bn": "দিনাজপুর",
        "upazilas": [
          {
            "name": "Nawabganj",
            "name_bn": "নবাবগঞ্জ"
          },
          {
            "name": "Birganj",
            "name_bn": "বীরগঞ্জ"
          },
          {
            "name": "Ghoraghat",
            "name_bn": "ঘোড়াঘাট"
          },
          {
            "name": "Birampur",
            "name_bn": "বিরামপুর"
          },
          {
            "name": "Parbatipur",
            "name_bn": "পার্বতীপুর"
          },
          {
            "name": "Bochaganj",
            "name_bn": "বোচাগঞ্জ"
          },
          {
            "name": "Kaharol",
            "name_bn": "কাহারোল"
          },
          {
            "name": "Fulbari",
            "name_bn": "ফুলবাড়ী"
          },
          {
            "name": "Dinajpur Sadar",
            "name_bn": "দিনাজপুর সদর"
          },
          {
            "name": "Hakimpur",
            "name_bn": "হাকিমপুর"
          },
          {
            "name": "Khansama",
            "name_bn": "খানসামা"
          },
          {
            "name": "Birol",
            "name_bn": "বিরল"
          },
          {
            "name": "Chirirbandar",
            "name_bn": "চিরিরবন্দর"
          }
        ]
      },
      {
        "name": "Lalmonirhat",
        "name_bn": "লালমনিরহাট",
        "upazilas": [
          {
            "name": "Lalmonirhat Sadar",
            "name_bn": "লালমনিরহাট সদর"
          },
          {
            "name": "Kaliganj",
            "name_bn": "কালীগঞ্জ"
          },
          {
            "name": "Hatibandha",
            "name_bn": "হাতীবান্ধা"
          },
          {
            "name": "Patgram",
            "name_bn": "পাটগ্রাম"
          },
          {
            "name": "Aditmari",
            "name_bn": "আদিতমারী"
          }
        ]
      },
      {
        "name": "Nilphamari",
        "name_bn": "নীলফামারী",
        "upazilas": [
          {
            "name": "Syedpur",
            "name_bn": "সৈয়দপুর"
          },
          {
            "name": "Domar",
            "name_bn": "ডোমার"
          },
          {
            "name": "Dimla",
            "name_bn": "ডিমলা"
          },
          {
            "name": "Jaldhaka",
            "name_bn": "জলঢাকা"
          },
          {
            "name": "Kishorganj",
            "name_bn": "কিশোরগঞ্জ"
          },
          {
            "name": "Nilphamari Sadar",
            "name_bn": "নীলফামারী সদর"
          }
        ]
      },
      {
        "name": "Gaibandha",
        "name_bn": "গাইবান্ধা",
        "upazilas": [
          {
            "name": "Sadullapur",
            "name_bn": "সাদুল্লাপুর"
          },
          {
            "name": "Gaibandha Sadar",
            "name_bn": "গাইবান্ধা সদর"
          },
          {
            "name": "Palashbari",
            "name_bn": "পলাশবাড়ী"
          },
          {
            "name": "Saghata",
            "name_bn": "সাঘাটা"
          },
          {
            "name": "Gobindaganj",
            "name_bn": "গোবিন্দগঞ্জ"
          },
          {
            "name": "Sundarganj",
            "name_bn": "সুন্দরগঞ্জ"
          },
          {
            "name": "Phulchari",
            "name_bn": "ফুলছড়ি"
          }
        ]
      },
      {
        "name": "Thakurgaon",
        "name_bn": "ঠাকুরগাঁও",
        "upazilas": [
          {
            "name": "Thakurgaon Sadar",
            "name_bn": "ঠাকুরগাঁও সদর"
          },
          {
            "name": "Pirganj",
            "name_bn": "পীরগঞ্জ"
          },
          {
            "name": "Ranisankail",
            "name_bn": "রাণীশংকৈল"
          },
          {
            "name": "Haripur",
            "name_bn": "হরিপুর"
          },
          {
            "name": "Baliadangi",
            "name_bn": "বালিয়াডাঙ্গী"
          }
        ]
      },
      {
        "name": "Rangpur",
        "name_bn": "রংপুর",
        "upazilas": [
          {
            "name": "Rangpur Sadar",
            "name_bn": "রংপুর সদর"
          },
          {
            "name": "Gangachara",
            "name_bn": "গংগাচড়া"
          },
          {
            "name": "Taragonj",
            "name_bn": "তারাগঞ্জ"
          },
          {
            "name": "Badargonj",
            "name_bn": "বদরগঞ্জ"
          },
          {
            "name": "Mithapukur",
            "name_bn": "মিঠাপুকুর"
          },
          {
            "name": "Pirgonj",
            "name_bn": "পীরগঞ্জ"
          },
          {
            "name": "Kaunia",
            "name_bn": "কাউনিয়া"
          },
          {
            "name": "Pirgacha",
            "name_bn": "পীরগাছা"
          }
        ]
      },
      {
        "name": "Kurigram",
        "name_bn": "কুড়িগ্রাম",
        "upazilas": [
          {
            "name": "Kurigram Sadar",
            "name_bn": "কুড়িগ্রাম সদর"
          },
          {
            "name": "Nageshwari",
            "name_bn": "নাগেশ্বরী"
          },
          {
            "name": "Bhurungamari",
            "name_bn": "ভুরুঙ্গামারী"
          },
          {
            "name": "Phulbari",
            "name_bn": "ফুলবাড়ী"
          },
          {
            "name": "Rajarhat",
            "name_bn": "রাজারহাট"
          },
          {
            "name": "Ulipur",
            "name_bn": "উলিপুর"
          },
          {
            "name": "Chilmari",
            "name_bn": "চিলমারী"
          },
          {
            "name": "Rowmari",
            "name_bn": "রৌমারী"
          },
          {
            "name": "Charrajibpur",
            "name_bn": "চর রাজিবপুর"
          }
        ]
      }
    ]
  },
  {
    "name": "Mymensingh",
    "name_bn": "ময়মনসিংহ",
    "districts": [
      {
        "name": "Sherpur",
        "name_bn": "শেরপুর",
        "upazilas": [
          {
            "name": "Sherpur Sadar",
            "name_bn": "শেরপুর সদর"
          },
          {
            "name": "Nalitabari",
            "name_bn": "নালিতাবাড়ী"
          },
          {
            "name": "Sreebordi",
            "name_bn": "শ্রীবরদী"
          },
          {
            "name": "Nokla",
            "name_bn": "নকলা"
          },
          {
            "name": "Jhenaigati",
            "name_bn": "ঝিনাইগাতী"
          }
        ]
      },
      {
        "name": "Mymensingh",
        "name_bn": "ময়মনসিংহ",
        "upazilas": [
          {
            "name": "Fulbaria",
            "name_bn": "ফুলবাড়ীয়া"
          },
          {
            "name": "Trishal",
            "name_bn": "ত্রিশাল"
          },
          {
            "name": "Bhaluka",
            "name_bn": "ভালুকা"
          },
          {
            "name": "Muktagacha",
            "name_bn": "মুক্তাগাছা"
          },
          {
            "name": "Mymensingh Sadar",
            "name_bn": "ময়মনসিংহ সদর"
          },
          {
            "name": "Dhobaura",
            "name_bn": "ধোবাউড়া"
          },
          {
            "name": "Phulpur",
            "name_bn": "ফুলপুর"
          },
          {
            "name": "Haluaghat",
            "name_bn": "হালুয়াঘাট"
          },
          {
            "name": "Gouripur",
            "name_bn": "গৌরীপুর"
          },
          {
            "name": "Gafargaon",
            "name_bn": "গফরগাঁও"
          },
          {
            "name": "Iswarganj",
            "name_bn": "ঈশ্বরগঞ্জ"
          },
          {
            "name": "Nandail",
            "name_bn": "নান্দাইল"
          },
          {
            "name": "Tarakanda",
            "name_bn": "তারাকান্দা"
          }
        ]
      },
      {
        "name": "Jamalpur",
        "name_bn": "জামালপুর",
        "upazilas": [
          {
            "name": "Jamalpur Sadar",
            "name_bn": "জামালপুর সদর"
          },
          {
            "name": "Melandah",
            "name_bn": "মেলান্দহ"
          },
          {
            "name": "Islampur",
            "name_bn": "ইসলামপুর"
          },
          {
            "name": "Dewangonj",
            "name_bn": "দেওয়ানগঞ্জ"
          },
          {
            "name": "Sarishabari",
            "name_bn": "সরিষাবাড়ী"
          },
          {
            "name": "Madarganj",
            "name_bn": "মাদারগঞ্জ"
          },
          {
            "name": "Bokshiganj",
            "name_bn": "বকশীগঞ্জ"
          }
        ]
      },
      {
        "name": "Netrokona",
        "name_bn": "নেত্রকোণা",
        "upazilas": [
          {
            "name": "Barhatta",
            "name_bn": "বারহাট্টা"
          },
          {
            "name": "Durgapur",
            "name_bn": "দুর্গাপুর"
          },
          {
            "name": "Kendua",
            "name_bn": "কেন্দুয়া"
          },
          {
            "name": "Atpara",
            "name_bn": "আটপাড়া"
          },
          {
            "name": "Madan",
            "name_bn": "মদন"
          },
          {
            "name": "Khaliajuri",
            "name_bn": "খালিয়াজুরী"
          },
          {
            "name": "Kalmakanda",
            "name_bn": "কলমাকান্দা"
          },
          {
            "name": "Mohongonj",
            "name_bn": "মোহনগঞ্জ"
          },
          {
            "name": "Purbadhala",
            "name_bn": "পূর্বধলা"
          },
          {
            "name": "Netrokona Sadar",
            "name_bn": "নেত্রকোণা সদর"
          }
        ]
      }
    ]
  }
];
