// বাংলাদেশের বিভাগ > জেলা > উপজেলা ডেটা
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
    name: "Dhaka",
    name_bn: "ঢাকা",
    districts: [
      {
        name: "Dhaka",
        name_bn: "ঢাকা",
        upazilas: [
          { name: "Dhanmondi", name_bn: "ধানমন্ডি" },
          { name: "Gulshan", name_bn: "গুলশান" },
          { name: "Mirpur", name_bn: "মিরপুর" },
          { name: "Mohammadpur", name_bn: "মোহাম্মদপুর" },
          { name: "Uttara", name_bn: "উত্তরা" },
          { name: "Motijheel", name_bn: "মতিঝিল" },
          { name: "Tejgaon", name_bn: "তেজগাঁও" },
          { name: "Ramna", name_bn: "রমনা" },
          { name: "Banani", name_bn: "বনানী" },
          { name: "Badda", name_bn: "বাড্ডা" },
          { name: "Khilgaon", name_bn: "খিলগাঁও" },
          { name: "Savar", name_bn: "সাভার" },
          { name: "Keraniganj", name_bn: "কেরানীগঞ্জ" },
          { name: "Dohar", name_bn: "দোহার" },
          { name: "Nawabganj", name_bn: "নবাবগঞ্জ" },
        ],
      },
      {
        name: "Gazipur",
        name_bn: "গাজীপুর",
        upazilas: [
          { name: "Gazipur Sadar", name_bn: "গাজীপুর সদর" },
          { name: "Kaliakair", name_bn: "কালিয়াকৈর" },
          { name: "Kaliganj", name_bn: "কালীগঞ্জ" },
          { name: "Kapasia", name_bn: "কাপাসিয়া" },
          { name: "Sreepur", name_bn: "শ্রীপুর" },
          { name: "Tongi", name_bn: "টঙ্গী" },
        ],
      },
      {
        name: "Narayanganj",
        name_bn: "নারায়ণগঞ্জ",
        upazilas: [
          { name: "Narayanganj Sadar", name_bn: "নারায়ণগঞ্জ সদর" },
          { name: "Araihazar", name_bn: "আড়াইহাজার" },
          { name: "Bandar", name_bn: "বন্দর" },
          { name: "Rupganj", name_bn: "রূপগঞ্জ" },
          { name: "Sonargaon", name_bn: "সোনারগাঁও" },
        ],
      },
      {
        name: "Tangail",
        name_bn: "টাঙ্গাইল",
        upazilas: [
          { name: "Tangail Sadar", name_bn: "টাঙ্গাইল সদর" },
          { name: "Madhupur", name_bn: "মধুপুর" },
          { name: "Gopalpur", name_bn: "গোপালপুর" },
          { name: "Mirzapur", name_bn: "মির্জাপুর" },
        ],
      },
      {
        name: "Manikganj",
        name_bn: "মানিকগঞ্জ",
        upazilas: [
          { name: "Manikganj Sadar", name_bn: "মানিকগঞ্জ সদর" },
          { name: "Singair", name_bn: "সিংগাইর" },
          { name: "Shibalaya", name_bn: "শিবালয়" },
        ],
      },
      {
        name: "Munshiganj",
        name_bn: "মুন্সিগঞ্জ",
        upazilas: [
          { name: "Munshiganj Sadar", name_bn: "মুন্সিগঞ্জ সদর" },
          { name: "Sreenagar", name_bn: "শ্রীনগর" },
          { name: "Lohajang", name_bn: "লৌহজং" },
        ],
      },
      {
        name: "Narsingdi",
        name_bn: "নরসিংদী",
        upazilas: [
          { name: "Narsingdi Sadar", name_bn: "নরসিংদী সদর" },
          { name: "Palash", name_bn: "পলাশ" },
          { name: "Shibpur", name_bn: "শিবপুর" },
        ],
      },
      {
        name: "Faridpur",
        name_bn: "ফরিদপুর",
        upazilas: [
          { name: "Faridpur Sadar", name_bn: "ফরিদপুর সদর" },
          { name: "Bhanga", name_bn: "ভাঙ্গা" },
          { name: "Boalmari", name_bn: "বোয়ালমারী" },
        ],
      },
      {
        name: "Gopalganj",
        name_bn: "গোপালগঞ্জ",
        upazilas: [
          { name: "Gopalganj Sadar", name_bn: "গোপালগঞ্জ সদর" },
          { name: "Kashiani", name_bn: "কাশিয়ানী" },
          { name: "Tungipara", name_bn: "টুঙ্গিপাড়া" },
        ],
      },
      {
        name: "Kishoreganj",
        name_bn: "কিশোরগঞ্জ",
        upazilas: [
          { name: "Kishoreganj Sadar", name_bn: "কিশোরগঞ্জ সদর" },
          { name: "Bhairab", name_bn: "ভৈরব" },
          { name: "Bajitpur", name_bn: "বাজিতপুর" },
        ],
      },
      {
        name: "Madaripur",
        name_bn: "মাদারীপুর",
        upazilas: [
          { name: "Madaripur Sadar", name_bn: "মাদারীপুর সদর" },
          { name: "Rajoir", name_bn: "রাজৈর" },
        ],
      },
      {
        name: "Rajbari",
        name_bn: "রাজবাড়ী",
        upazilas: [
          { name: "Rajbari Sadar", name_bn: "রাজবাড়ী সদর" },
          { name: "Goalanda", name_bn: "গোয়ালন্দ" },
          { name: "Pangsha", name_bn: "পাংশা" },
        ],
      },
      {
        name: "Shariatpur",
        name_bn: "শরীয়তপুর",
        upazilas: [
          { name: "Shariatpur Sadar", name_bn: "শরীয়তপুর সদর" },
          { name: "Naria", name_bn: "নড়িয়া" },
        ],
      },
    ],
  },
  {
    name: "Chattogram",
    name_bn: "চট্টগ্রাম",
    districts: [
      {
        name: "Chattogram",
        name_bn: "চট্টগ্রাম",
        upazilas: [
          { name: "Chattogram Sadar", name_bn: "চট্টগ্রাম সদর" },
          { name: "Panchlaish", name_bn: "পাঁচলাইশ" },
          { name: "Hathazari", name_bn: "হাটহাজারী" },
          { name: "Sitakunda", name_bn: "সীতাকুণ্ড" },
          { name: "Pahartali", name_bn: "পাহাড়তলী" },
          { name: "Patiya", name_bn: "পটিয়া" },
        ],
      },
      {
        name: "Comilla",
        name_bn: "কুমিল্লা",
        upazilas: [
          { name: "Comilla Sadar", name_bn: "কুমিল্লা সদর" },
          { name: "Debidwar", name_bn: "দেবিদ্বার" },
          { name: "Brahmanpara", name_bn: "ব্রাহ্মণপাড়া" },
        ],
      },
      {
        name: "Cox's Bazar",
        name_bn: "কক্সবাজার",
        upazilas: [
          { name: "Cox's Bazar Sadar", name_bn: "কক্সবাজার সদর" },
          { name: "Teknaf", name_bn: "টেকনাফ" },
          { name: "Ukhia", name_bn: "উখিয়া" },
        ],
      },
      {
        name: "Feni",
        name_bn: "ফেনী",
        upazilas: [
          { name: "Feni Sadar", name_bn: "ফেনী সদর" },
          { name: "Daganbhuiyan", name_bn: "দাগনভূঁইয়া" },
        ],
      },
      {
        name: "Noakhali",
        name_bn: "নোয়াখালী",
        upazilas: [
          { name: "Noakhali Sadar", name_bn: "নোয়াখালী সদর" },
          { name: "Begumganj", name_bn: "বেগমগঞ্জ" },
        ],
      },
      {
        name: "Brahmanbaria",
        name_bn: "ব্রাহ্মণবাড়িয়া",
        upazilas: [
          { name: "Brahmanbaria Sadar", name_bn: "ব্রাহ্মণবাড়িয়া সদর" },
          { name: "Ashuganj", name_bn: "আশুগঞ্জ" },
        ],
      },
      {
        name: "Chandpur",
        name_bn: "চাঁদপুর",
        upazilas: [
          { name: "Chandpur Sadar", name_bn: "চাঁদপুর সদর" },
          { name: "Haimchar", name_bn: "হাইমচর" },
        ],
      },
      {
        name: "Lakshmipur",
        name_bn: "লক্ষ্মীপুর",
        upazilas: [
          { name: "Lakshmipur Sadar", name_bn: "লক্ষ্মীপুর সদর" },
          { name: "Raipur", name_bn: "রায়পুর" },
        ],
      },
      {
        name: "Rangamati",
        name_bn: "রাঙ্গামাটি",
        upazilas: [
          { name: "Rangamati Sadar", name_bn: "রাঙ্গামাটি সদর" },
        ],
      },
      {
        name: "Khagrachhari",
        name_bn: "খাগড়াছড়ি",
        upazilas: [
          { name: "Khagrachhari Sadar", name_bn: "খাগড়াছড়ি সদর" },
        ],
      },
      {
        name: "Bandarban",
        name_bn: "বান্দরবান",
        upazilas: [
          { name: "Bandarban Sadar", name_bn: "বান্দরবান সদর" },
        ],
      },
    ],
  },
  {
    name: "Rajshahi",
    name_bn: "রাজশাহী",
    districts: [
      {
        name: "Rajshahi",
        name_bn: "রাজশাহী",
        upazilas: [
          { name: "Rajshahi Sadar", name_bn: "রাজশাহী সদর" },
          { name: "Paba", name_bn: "পবা" },
          { name: "Godagari", name_bn: "গোদাগাড়ী" },
          { name: "Tanore", name_bn: "তানোর" },
          { name: "Bagmara", name_bn: "বাঘমারা" },
        ],
      },
      {
        name: "Naogaon",
        name_bn: "নওগাঁ",
        upazilas: [
          { name: "Naogaon Sadar", name_bn: "নওগাঁ সদর" },
          { name: "Sapahar", name_bn: "সাপাহার" },
          { name: "Porsha", name_bn: "পোরশা" },
          { name: "Patnitala", name_bn: "পত্নীতলা" },
          { name: "Dhamoirhat", name_bn: "ধামইরহাট" },
          { name: "Manda", name_bn: "মান্দা" },
          { name: "Niamatpur", name_bn: "নিয়ামতপুর" },
          { name: "Atrai", name_bn: "আত্রাই" },
          { name: "Raninagar", name_bn: "রাণীনগর" },
          { name: "Badalgachhi", name_bn: "বদলগাছি" },
          { name: "Mahadebpur", name_bn: "মহাদেবপুর" },
        ],
      },
      {
        name: "Natore",
        name_bn: "নাটোর",
        upazilas: [
          { name: "Natore Sadar", name_bn: "নাটোর সদর" },
          { name: "Bagatipara", name_bn: "বাগাতিপাড়া" },
          { name: "Baraigram", name_bn: "বড়াইগ্রাম" },
        ],
      },
      {
        name: "Nawabganj",
        name_bn: "নবাবগঞ্জ",
        upazilas: [
          { name: "Nawabganj Sadar", name_bn: "নবাবগঞ্জ সদর" },
          { name: "Shibganj", name_bn: "শিবগঞ্জ" },
          { name: "Gomastapur", name_bn: "গোমস্তাপুর" },
        ],
      },
      {
        name: "Pabna",
        name_bn: "পাবনা",
        upazilas: [
          { name: "Pabna Sadar", name_bn: "পাবনা সদর" },
          { name: "Ishwardi", name_bn: "ঈশ্বরদী" },
          { name: "Bera", name_bn: "বেড়া" },
        ],
      },
      {
        name: "Sirajganj",
        name_bn: "সিরাজগঞ্জ",
        upazilas: [
          { name: "Sirajganj Sadar", name_bn: "সিরাজগঞ্জ সদর" },
          { name: "Shahjadpur", name_bn: "শাহজাদপুর" },
          { name: "Belkuchi", name_bn: "বেলকুচি" },
        ],
      },
      {
        name: "Bogra",
        name_bn: "বগুড়া",
        upazilas: [
          { name: "Bogra Sadar", name_bn: "বগুড়া সদর" },
          { name: "Shibganj", name_bn: "শিবগঞ্জ" },
          { name: "Sherpur", name_bn: "শেরপুর" },
        ],
      },
      {
        name: "Joypurhat",
        name_bn: "জয়পুরহাট",
        upazilas: [
          { name: "Joypurhat Sadar", name_bn: "জয়পুরহাট সদর" },
          { name: "Akkelpur", name_bn: "আক্কেলপুর" },
          { name: "Panchbibi", name_bn: "পাঁচবিবি" },
        ],
      },
    ],
  },
  {
    name: "Khulna",
    name_bn: "খুলনা",
    districts: [
      {
        name: "Khulna",
        name_bn: "খুলনা",
        upazilas: [
          { name: "Khulna Sadar", name_bn: "খুলনা সদর" },
          { name: "Sonadanga", name_bn: "সোনাডাঙ্গা" },
          { name: "Dumuria", name_bn: "ডুমুরিয়া" },
        ],
      },
      {
        name: "Jessore",
        name_bn: "যশোর",
        upazilas: [
          { name: "Jessore Sadar", name_bn: "যশোর সদর" },
          { name: "Benapole", name_bn: "বেনাপোল" },
          { name: "Jhikargachha", name_bn: "ঝিকরগাছা" },
        ],
      },
      {
        name: "Satkhira",
        name_bn: "সাতক্ষীরা",
        upazilas: [
          { name: "Satkhira Sadar", name_bn: "সাতক্ষীরা সদর" },
        ],
      },
      {
        name: "Kushtia",
        name_bn: "কুষ্টিয়া",
        upazilas: [
          { name: "Kushtia Sadar", name_bn: "কুষ্টিয়া সদর" },
          { name: "Kumarkhali", name_bn: "কুমারখালী" },
        ],
      },
      {
        name: "Bagerhat",
        name_bn: "বাগেরহাট",
        upazilas: [
          { name: "Bagerhat Sadar", name_bn: "বাগেরহাট সদর" },
          { name: "Mongla", name_bn: "মোংলা" },
        ],
      },
      {
        name: "Jhenaidah",
        name_bn: "ঝিনাইদহ",
        upazilas: [
          { name: "Jhenaidah Sadar", name_bn: "ঝিনাইদহ সদর" },
        ],
      },
      {
        name: "Magura",
        name_bn: "মাগুরা",
        upazilas: [
          { name: "Magura Sadar", name_bn: "মাগুরা সদর" },
        ],
      },
      {
        name: "Meherpur",
        name_bn: "মেহেরপুর",
        upazilas: [
          { name: "Meherpur Sadar", name_bn: "মেহেরপুর সদর" },
        ],
      },
      {
        name: "Narail",
        name_bn: "নড়াইল",
        upazilas: [
          { name: "Narail Sadar", name_bn: "নড়াইল সদর" },
        ],
      },
      {
        name: "Chuadanga",
        name_bn: "চুয়াডাঙ্গা",
        upazilas: [
          { name: "Chuadanga Sadar", name_bn: "চুয়াডাঙ্গা সদর" },
        ],
      },
    ],
  },
  {
    name: "Barishal",
    name_bn: "বরিশাল",
    districts: [
      {
        name: "Barishal",
        name_bn: "বরিশাল",
        upazilas: [
          { name: "Barishal Sadar", name_bn: "বরিশাল সদর" },
          { name: "Bakerganj", name_bn: "বাকেরগঞ্জ" },
          { name: "Babuganj", name_bn: "বাবুগঞ্জ" },
        ],
      },
      {
        name: "Patuakhali",
        name_bn: "পটুয়াখালী",
        upazilas: [
          { name: "Patuakhali Sadar", name_bn: "পটুয়াখালী সদর" },
        ],
      },
      {
        name: "Bhola",
        name_bn: "ভোলা",
        upazilas: [
          { name: "Bhola Sadar", name_bn: "ভোলা সদর" },
        ],
      },
      {
        name: "Pirojpur",
        name_bn: "পিরোজপুর",
        upazilas: [
          { name: "Pirojpur Sadar", name_bn: "পিরোজপুর সদর" },
        ],
      },
      {
        name: "Jhalokathi",
        name_bn: "ঝালকাঠি",
        upazilas: [
          { name: "Jhalokathi Sadar", name_bn: "ঝালকাঠি সদর" },
        ],
      },
      {
        name: "Barguna",
        name_bn: "বরগুনা",
        upazilas: [
          { name: "Barguna Sadar", name_bn: "বরগুনা সদর" },
        ],
      },
    ],
  },
  {
    name: "Sylhet",
    name_bn: "সিলেট",
    districts: [
      {
        name: "Sylhet",
        name_bn: "সিলেট",
        upazilas: [
          { name: "Sylhet Sadar", name_bn: "সিলেট সদর" },
          { name: "South Surma", name_bn: "দক্ষিণ সুরমা" },
          { name: "Osmaninagar", name_bn: "ওসমানীনগর" },
        ],
      },
      {
        name: "Moulvibazar",
        name_bn: "মৌলভীবাজার",
        upazilas: [
          { name: "Moulvibazar Sadar", name_bn: "মৌলভীবাজার সদর" },
          { name: "Sreemangal", name_bn: "শ্রীমঙ্গল" },
        ],
      },
      {
        name: "Habiganj",
        name_bn: "হবিগঞ্জ",
        upazilas: [
          { name: "Habiganj Sadar", name_bn: "হবিগঞ্জ সদর" },
        ],
      },
      {
        name: "Sunamganj",
        name_bn: "সুনামগঞ্জ",
        upazilas: [
          { name: "Sunamganj Sadar", name_bn: "সুনামগঞ্জ সদর" },
        ],
      },
    ],
  },
  {
    name: "Rangpur",
    name_bn: "রংপুর",
    districts: [
      {
        name: "Rangpur",
        name_bn: "রংপুর",
        upazilas: [
          { name: "Rangpur Sadar", name_bn: "রংপুর সদর" },
          { name: "Mithapukur", name_bn: "মিঠাপুকুর" },
          { name: "Badarganj", name_bn: "বদরগঞ্জ" },
        ],
      },
      {
        name: "Dinajpur",
        name_bn: "দিনাজপুর",
        upazilas: [
          { name: "Dinajpur Sadar", name_bn: "দিনাজপুর সদর" },
          { name: "Birampur", name_bn: "বীরামপুর" },
          { name: "Parbatipur", name_bn: "পার্বতীপুর" },
        ],
      },
      {
        name: "Kurigram",
        name_bn: "কুড়িগ্রাম",
        upazilas: [
          { name: "Kurigram Sadar", name_bn: "কুড়িগ্রাম সদর" },
        ],
      },
      {
        name: "Gaibandha",
        name_bn: "গাইবান্ধা",
        upazilas: [
          { name: "Gaibandha Sadar", name_bn: "গাইবান্ধা সদর" },
        ],
      },
      {
        name: "Lalmonirhat",
        name_bn: "লালমনিরহাট",
        upazilas: [
          { name: "Lalmonirhat Sadar", name_bn: "লালমনিরহাট সদর" },
        ],
      },
      {
        name: "Nilphamari",
        name_bn: "নীলফামারী",
        upazilas: [
          { name: "Nilphamari Sadar", name_bn: "নীলফামারী সদর" },
          { name: "Saidpur", name_bn: "সৈয়দপুর" },
        ],
      },
      {
        name: "Panchagarh",
        name_bn: "পঞ্চগড়",
        upazilas: [
          { name: "Panchagarh Sadar", name_bn: "পঞ্চগড় সদর" },
        ],
      },
      {
        name: "Thakurgaon",
        name_bn: "ঠাকুরগাঁও",
        upazilas: [
          { name: "Thakurgaon Sadar", name_bn: "ঠাকুরগাঁও সদর" },
        ],
      },
    ],
  },
  {
    name: "Mymensingh",
    name_bn: "ময়মনসিংহ",
    districts: [
      {
        name: "Mymensingh",
        name_bn: "ময়মনসিংহ",
        upazilas: [
          { name: "Mymensingh Sadar", name_bn: "ময়মনসিংহ সদর" },
          { name: "Trishal", name_bn: "ত্রিশাল" },
          { name: "Bhaluka", name_bn: "ভালুকা" },
        ],
      },
      {
        name: "Jamalpur",
        name_bn: "জামালপুর",
        upazilas: [
          { name: "Jamalpur Sadar", name_bn: "জামালপুর সদর" },
        ],
      },
      {
        name: "Netrokona",
        name_bn: "নেত্রকোনা",
        upazilas: [
          { name: "Netrokona Sadar", name_bn: "নেত্রকোনা সদর" },
        ],
      },
      {
        name: "Sherpur",
        name_bn: "শেরপুর",
        upazilas: [
          { name: "Sherpur Sadar", name_bn: "শেরপুর সদর" },
        ],
      },
    ],
  },
];
