/* UGC NET study tracker seed data. Syllabus wording is structured from the official UGC NET Paper I and Psychology (04) PDFs; planning labels are estimates. */
(function (root) {
  'use strict';
  const PAPER1_SOURCE = 'https://www.ugcnetonline.in/showPdf.php?p1=NTA_All_R_Syllabus/00-Paper-I/Paper-I_English.pdf';
  const PSY_SOURCE = 'https://www.ugcnetonline.in/NTA_All_R_Syllabus/04/Psychology_English.pdf';
  const OFFICIAL_PAGE = 'https://www.ugcnetonline.in/syllabus-new.php';

  // Syllabus checklist. Each concept is linked to a 15-day-plan day by unit (see build15DayPlan).
  const PSY_UNITS = [
    { id:'p2-u01', number:1, title:'Emergence of Psychology', topics:[
      { title:'Eastern and Indian psychology', subtopics:[
        { name:'Psychological thought in major Eastern systems', concepts:['Bhagavad Gita: psychological ideas and human action','Buddhist perspectives on mind, suffering and change','Sufi perspectives on self and inner development','Integral Yoga and psychological development'] },
        { name:'Academic psychology in India', concepts:['Pre-independence academic psychology in India','Post-independence development of psychology','1970s shift toward addressing social issues','1980s indigenization movement','1990s paradigmatic concerns and disciplinary identity crisis','2000s emergence of Indian psychology in academia','Colonial encounter and its influence on psychology','Post-colonialism and psychology','Question of a distinct disciplinary identity'] },
        { name:'Indic influences and knowledge traditions', concepts:['Indic influences on modern psychology','Yoga as a psychological knowledge tradition','Bhagavad Gita as a source of psychological knowledge','Buddhist, Sufi and Integral Yoga perspectives','Science and spirituality: avidya and vidya','Primacy of self-knowledge in Indian psychology'] }
      ]},
      { title:'Western emergence and schools of psychology', subtopics:[
        { name:'Historical foundations', concepts:['Greek heritage in psychological thought','Medieval contributions to psychological thought','Modern period and the emergence of psychology','Wundt and the experimental path to academic psychology','Freud and the psychoanalytic path','William James and the functional path','Dilthey and the human-science path'] },
        { name:'Major schools and movements', concepts:['Structuralism','Functionalism','Psychoanalytical school','Gestalt psychology','Behaviourism','Humanistic-existential psychology','Transpersonal psychology','Cognitive revolution','Multiculturalism in psychology'] },
        { name:'Historical and paradigmatic issues', concepts:['Crisis arising from strict experimental-analytical approaches','Logical empiricism and its influence on psychology','Limits of a single experimental-analytical paradigm'] }
      ]},
      { title:'Paradigms of psychological knowledge', subtopics:[
        { name:'Essential aspects of a knowledge paradigm', concepts:['Ontology: assumptions about what exists','Epistemology: assumptions about knowledge','Methodology: how knowledge is produced','Distinguish ontology, epistemology and methodology'] },
        { name:'Western paradigms', concepts:['Positivism','Post-positivism','Critical perspective','Social constructionism','Existential phenomenology','Co-operative enquiry','Paradigmatic controversies in psychology'] }
      ]}
    ]},
    { id:'p2-u02', number:2, title:'Research Methodology and Statistics', topics:[
      { title:'Research foundations', subtopics:[
        { name:'Meaning, purpose and dimensions of research', concepts:['Meaning of research','Purpose of psychological research','Dimensions and scope of research','Basic research terminology'] },
        { name:'Research problems and variables', concepts:['Identify and formulate a research problem','Independent and dependent variables','Extraneous, confounding and control variables','Operational definitions','Distinguish a construct from its operational definition'] },
        { name:'Hypotheses', concepts:['Null and alternative hypotheses','Directional and non-directional hypotheses','Translate a research question into a testable hypothesis'] },
        { name:'Sampling', concepts:['Target population and sampling frame','Probability and non-probability sampling','Common probability sampling approaches','Common non-probability sampling approaches','Sampling error and sources of bias'] },
        { name:'Research ethics and reporting', concepts:['Informed consent and voluntary participation','Confidentiality and privacy','Deception and debriefing','Research integrity, plagiarism and responsible reporting','Ethical conduct with human participants'] }
      ]},
      { title:'Research paradigms and methods', subtopics:[
        { name:'Research paradigms', concepts:['Quantitative research: purpose and evidence','Qualitative research: purpose and evidence','Mixed-methods approach','Choose a paradigm to fit a research question'] },
        { name:'Observation, surveys and field methods', concepts:['Observation methods','Survey research','Interview method','Questionnaire method','Field studies'] },
        { name:'Experimental and comparative methods', concepts:['Experimental research method','Quasi-experimental research method','Cross-cultural studies','Case study method','Single-case approaches'] },
        { name:'Qualitative methods', concepts:['Phenomenology as a research method','Grounded theory','Focus groups','Narrative method','Ethnography'] }
      ]},
      { title:'Statistics and statistical inference', subtopics:[
        { name:'Descriptive statistics', concepts:['Mean and when it is informative','Median and when it is informative','Mode and its uses','Range','Variance','Standard deviation','Percentiles and percentile ranks','Interpret descriptive statistics in a short dataset'] },
        { name:'Normal probability curve', concepts:['Properties of the normal probability curve','Standard scores and relative position','Interpret area and score location conceptually'] },
        { name:'Parametric testing and t-test logic', concepts:['Purpose of a t-test','Match common t-test situations to a design','Statistical significance and the null hypothesis','p-value interpretation without equating significance with importance'] },
        { name:'Power and effect size', concepts:['Effect size: magnitude of an observed effect','Statistical power and its meaning','Factors that affect power','Distinguish statistical significance from practical importance'] },
        { name:'Non-parametric tests', concepts:['When a non-parametric test is appropriate','Sign test','Wilcoxon signed-rank test','Mann–Whitney test','Kruskal–Wallis test','Friedman test','Select a non-parametric test for independent versus related groups'] }
      ]},
      { title:'Correlation, regression and factor analysis', subtopics:[
        { name:'Correlation methods', concepts:['Pearson product-moment correlation','Rank-order correlation','Partial correlation','Multiple correlation','Biserial correlation','Point-biserial correlation','Tetrachoric correlation','Phi coefficient','Interpret direction and strength of a correlation','Correlation does not establish causation'] },
        { name:'Regression', concepts:['Simple linear regression','Multiple regression','Prediction versus causal explanation','Interpret a regression coefficient conceptually'] },
        { name:'Factor analysis', concepts:['Purpose and assumptions of factor analysis','Factor extraction methods: overview','Factor rotation and its purpose','Interpret factor loadings and factor solutions'] }
      ]},
      { title:'Experimental and advanced research designs', subtopics:[
        { name:'Experimental design foundations', concepts:['Experimental versus quasi-experimental design','Control and comparison groups','Random assignment','Internal validity and threats','External validity and generalization','Distinguish random sampling from random assignment'] },
        { name:'ANOVA and repeated designs', concepts:['One-way ANOVA: question answered','Factorial ANOVA: factors and levels','Main effects','Interaction effects','Randomized block design','Repeated-measures design','Match an ANOVA design to a research scenario'] },
        { name:'Advanced designs', concepts:['Latin square design','Cohort studies','Time-series design','MANOVA: multivariate outcomes','ANCOVA: covariate adjustment','Single-subject research designs','Recognize design strengths and limitations'] }
      ]}
    ]},
    { id:'p2-u03', number:3, title:'Psychological Testing', topics:[
      { title:'Test foundations and construction', subtopics:[
        { name:'Types and uses of psychological tests', concepts:['Individual and group tests','Objective and performance-based approaches','Speed and power tests','Ability, typical-performance and self-report formats','Choose a test format to fit an assessment purpose'] },
        { name:'Test construction and item analysis', concepts:['Define the construct and test blueprint','Write clear and unbiased items','Item difficulty','Item discrimination','Distractor analysis for selected-response items','Use item analysis to revise a test'] }
      ]},
      { title:'Standardization and psychometric quality', subtopics:[
        { name:'Standardization and norms', concepts:['Standardized administration and scoring','Norm-referenced interpretation','Criterion-referenced interpretation','Types and uses of norms','Norm groups and limitations of norm comparisons'] },
        { name:'Reliability', concepts:['Test–retest reliability','Split-half reliability','Internal consistency','Inter-rater reliability','Sources of measurement error','Factors that affect reliability'] },
        { name:'Validity', concepts:['Content validity','Criterion-related validity','Construct validity','Evidence for validity','Factors that affect validity','Reliability as a requirement but not proof of validity','Distinguish reliability from validity'] }
      ]},
      { title:'Assessment areas and applications', subtopics:[
        { name:'Major areas of testing', concepts:['Intelligence tests','Creativity tests','Neuropsychological tests','Aptitude tests','Personality assessment','Interest inventories','Match an assessment area to a referral question'] },
        { name:'Attitude scales and computer-based testing', concepts:['Likert scale','Semantic differential scale','Stapel scale','Computer-based psychological testing','Strengths and limitations of computer-based assessment'] },
        { name:'Applications of psychological testing', concepts:['Clinical settings','Organizational and business settings','Educational settings','Counselling settings','Military settings','Career guidance','Ethical interpretation and communication of test results'] }
      ]}
    ]},
    { id:'p2-u04', number:4, title:'Biological Basis of Behavior', topics:[
      { title:'Neural structure and communication', subtopics:[
        { name:'Neurons and neural impulse', concepts:['Neuron structure and major parts','Types of neurons','Neuron functions','Resting potential and neural impulse','Action potential sequence','All-or-none principle'] },
        { name:'Synaptic transmission and neurotransmitters', concepts:['Synaptic transmission sequence','Excitatory and inhibitory postsynaptic effects','Reuptake and enzymatic breakdown','Major neurotransmitters and broad functions','Distinguish neurotransmitters from hormones'] }
      ]},
      { title:'Nervous system and neuroplasticity', subtopics:[
        { name:'Central and peripheral nervous systems', concepts:['Central nervous system: brain and spinal cord','Peripheral nervous system overview','Somatic nervous system','Autonomic nervous system','Sympathetic and parasympathetic divisions','Major brain structures and broad functions'] },
        { name:'Neuroplasticity', concepts:['Neuroplasticity and neural change','Experience-dependent plasticity','Plasticity across development and recovery'] }
      ]},
      { title:'Physiological psychology methods', subtopics:[
        { name:'Invasive methods', concepts:['Anatomical methods','Degeneration techniques','Lesion techniques','Chemical methods','Microelectrode studies','Compare what invasive methods can reveal and their limitations'] },
        { name:'Non-invasive methods', concepts:['EEG and the signal it records','Scanning methods: broad categories','Match a physiological question to an appropriate method','Limits of inferring mental processes from physiological measures'] }
      ]},
      { title:'Sensory, muscular and glandular systems', subtopics:[
        { name:'Sensory systems', concepts:['General sensations','Specific sensations','Sensory receptors and their functions','Sensory transduction and processing','Receptor-to-perception sequence'] },
        { name:'Muscular and glandular systems', concepts:['Types and functions of muscular systems','Glandular system: major types and functions','Endocrine glands and major hormones','Distinguish nervous and endocrine signalling'] }
      ]},
      { title:'Biological motivation, emotion and genetics', subtopics:[
        { name:'Biological bases of motivation', concepts:['Biological basis of hunger','Biological basis of thirst','Sleep and biological regulation','Biological basis of sex'] },
        { name:'Emotion and genetic influences', concepts:['Limbic system and emotion','Hormonal regulation of behaviour','Chromosomal anomalies and behaviour','Nature–nurture controversy','Twin studies as evidence','Adoption studies as evidence','Limits of genetic inference from family designs'] }
      ]}
    ]},
    { id:'p2-u05', number:5, title:'Attention, Perception, Learning, Memory and Forgetting', topics:[
      { title:'Attention', subtopics:[
        { name:'Forms and models of attention', concepts:['Selective attention','Divided attention','Sustained attention','Other forms of attention and task demands','Major models of attention','Compare assumptions of attention models'] }
      ]},
      { title:'Perception', subtopics:[
        { name:'Approaches and perceptual organization', concepts:['Gestalt approach to perception','Physiological approach to perception','Figure and ground','Gestalt laws of organization','Perceptual grouping principles','Size constancy','Shape constancy','Colour constancy','Visual illusions and their interpretation'] },
        { name:'Form, depth and movement', concepts:['Perception of form','Monocular and binocular depth cues','Perception of movement','Pattern recognition'] },
        { name:'Signal detection and advanced perspectives', concepts:['Signal detection theory assumptions','Sensitivity and decision criterion','Applications of signal detection theory','Subliminal perception and related factors','Information-processing approach to perception','Role of motivation and learning in perception','Culture and perception','Perceptual styles','Ecological perspective on perception'] }
      ]},
      { title:'Learning', subtopics:[
        { name:'Fundamental learning theories', concepts:['Thorndike: law of effect and connectionism','Guthrie: contiguity theory','Hull: drive-reduction and neobehaviourist approach','Compare Thorndike, Guthrie and Hull','Use a learning theory to explain a simple example'] },
        { name:'Classical conditioning', concepts:['Classical conditioning procedure and terminology','Acquisition, extinction and spontaneous recovery','Generalization and discrimination','Higher-order conditioning and related phenomena','Classical-conditioning theoretical issues'] },
        { name:'Instrumental learning and reinforcement', concepts:['Instrumental learning paradigms','Instrumental-learning phenomena and theoretical issues','Positive and negative reinforcement','Reinforcement versus punishment','Basic reinforcement variables','Continuous and intermittent reinforcement','Fixed and variable schedules','Behaviour modification and applications'] },
        { name:'Cognitive, verbal and recent learning approaches', concepts:['Latent learning','Observational learning','Verbal learning','Discrimination learning','Neurophysiology of learning: recent trends'] }
      ]},
      { title:'Memory and forgetting', subtopics:[
        { name:'Memory processes and systems', concepts:['Encoding, storage and retrieval','Sensory memory','Short-term memory','Working memory','Long-term declarative memory','Episodic and semantic memory','Procedural memory','Compare major memory systems'] },
        { name:'Theories of forgetting', concepts:['Interference theory','Retrieval failure','Decay theory','Motivated forgetting','Distinguish explanations of forgetting using examples'] }
      ]}
    ]},
    { id:'p2-u06', number:6, title:'Thinking, Intelligence and Creativity', topics:[
      { title:'Thinking, concepts and reasoning', subtopics:[
        { name:'Theoretical perspectives on thought', concepts:['Associationism and thought','Gestalt perspective on thinking','Information-processing perspective','Feature integration model','Compare major approaches to thought processes'] },
        { name:'Concept formation and reasoning', concepts:['Concept formation: rules','Concept types and strategies','Role of concepts in thinking','Deductive reasoning','Inductive reasoning','Other types of reasoning in the syllabus context','Language and thought relationships'] }
      ]},
      { title:'Problem-solving, decision-making and metacognition', subtopics:[
        { name:'Problem-solving', concepts:['Types of problems','Problem-solving strategies','Obstacles to problem-solving','Identify strategy and obstacle in a scenario'] },
        { name:'Decision-making', concepts:['Types of decisions','Decision-making models','Heuristics and biases as supplementary application examples','Distinguish problem-solving from decision-making'] },
        { name:'Metacognition', concepts:['Metacognitive knowledge','Metacognitive regulation','Planning, monitoring and evaluating one’s thinking'] }
      ]},
      { title:'Intelligence', subtopics:[
        { name:'Theories and models of intelligence', concepts:['Spearman and general intelligence','Thurstone and primary mental abilities','Jensen’s theory of intelligence','Cattell: fluid and crystallized abilities','Gardner’s multiple intelligences','Sternberg’s triarchic theory','Goleman and emotional intelligence','Das, Kar and Parrila: PASS model','Compare the distinctive claims of intelligence theories'] }
      ]},
      { title:'Creativity', subtopics:[
        { name:'Theories and assessment of creativity', concepts:['Guilford and divergent production','Torrance and creative thinking assessment','Getzels and Jackson','Wallach and Kogan','Relationship between intelligence and creativity','Compare creativity theories and assessment approaches'] }
      ]}
    ]},
    { id:'p2-u07', number:7, title:'Personality, Motivation, Emotion, Stress and Coping', topics:[
      { title:'Personality', subtopics:[
        { name:'Psychoanalytic and neo-Freudian approaches', concepts:['Psychoanalytical approach to personality','Freud: core psychoanalytic constructs and mechanisms','Neo-Freudian approaches and distinctive emphases','Compare Freud with major neo-Freudian approaches'] },
        { name:'Determinants and trait/type approaches', concepts:['Biological determinants of personality','Socio-cultural determinants of personality','Trait approach','Type approach','Compare trait and type approaches'] },
        { name:'Social-learning, cognitive and humanistic approaches', concepts:['Social-learning approach to personality','Cognitive approach to personality','Humanistic approach','Existential approach','Transpersonal approach','Rotter’s locus of control','Seligman’s explanatory style','Kohlberg’s theory of moral development','Match a personality approach to an assessment or scenario'] }
      ]},
      { title:'Motivation', subtopics:[
        { name:'Basic concepts and motivational cycle', concepts:['Instincts','Needs','Drives','Arousal','Incentives','Motivational cycle','Distinguish needs, drives, arousal and incentives'] },
        { name:'Approaches to motivation', concepts:['Psychoanalytical approach to motivation','Ethological approach','Stimulus–response approach','Cognitive approach','Humanistic approach','Compare major motivational perspectives'] },
        { name:'Specific motives and self-regulation', concepts:['Exploratory behaviour and curiosity','Zuckerman’s sensation seeking','Achievement motivation','Affiliation motivation','Power motivation','Motivational competence','Self-regulation','Flow'] }
      ]},
      { title:'Emotion, conflict, stress and coping', subtopics:[
        { name:'Emotion and emotion regulation', concepts:['Physiological correlates of emotion','James–Lange theory','Cannon–Bard theory','Schachter–Singer two-factor theory','Lazarus cognitive appraisal theory','Lindsley activation theory','Compare major theories of emotion','Emotion regulation'] },
        { name:'Conflict, stress and coping', concepts:['Sources of conflict','Types of conflict','Concept of stress','Models of stress','Type A, B, C and D behaviour patterns','Coping and stress management principles'] },
        { name:'Stress-management strategies', concepts:['Biofeedback','Music therapy','Breathing exercises','Progressive muscular relaxation','Guided imagery','Mindfulness','Meditation','Yogasana','Stress inoculation training','Match a stress-management method with its principle'] }
      ]}
    ]},
    { id:'p2-u08', number:8, title:'Social Psychology', topics:[
      { title:'Foundations and theories', subtopics:[
        { name:'Nature, scope and history', concepts:['Nature and scope of social psychology','Historical development of social psychology','Person–situation and social-context perspectives'] },
        { name:'Traditional theoretical perspectives', concepts:['Field theory','Cognitive dissonance theory','Sociobiological approach','Psychodynamic approaches','Social cognition','Compare the questions addressed by major perspectives'] }
      ]},
      { title:'Social perception, attitudes and prosocial behaviour', subtopics:[
        { name:'Social perception and communication', concepts:['Social communication','Attribution processes','Attributional explanations and bias as applications','Interpret social behaviour in context'] },
        { name:'Attitudes and prosocial behaviour', concepts:['Attitude structure','Attitude change','Attitudes within cultural context','Persuasion processes','Prosocial behaviour','Distinguish prosocial behaviour from compliance'] }
      ]},
      { title:'Groups and social influence', subtopics:[
        { name:'Group processes', concepts:['Social facilitation','Social loafing','Group dynamics','Leadership styles','Leadership effectiveness'] },
        { name:'Social influence and aggression', concepts:['Conformity','Peer pressure','Persuasion','Compliance','Obedience','Social power','Reactance','Aggression','Distinguish conformity, compliance, obedience and persuasion'] }
      ]},
      { title:'Intergroup relations and applications', subtopics:[
        { name:'Theories of intergroup relations', concepts:['Minimal group experiment','Social Identity Theory','Relative Deprivation Theory','Realistic Conflict Theory','Balance theories','Equity theory','Social Exchange Theory','Compare explanations of group identity and intergroup conflict'] },
        { name:'Applied social psychology', concepts:['Applications to health','Applications to environment','Applications to law','Personal space','Crowding','Territoriality'] }
      ]}
    ]},
    { id:'p2-u09', number:9, title:'Human Development and Interventions', topics:[
      { title:'Human development', subtopics:[
        { name:'Developmental processes and successful aging', concepts:['Meaning of development','Principles of development','Factors in development','Stages of development','Nature and nurture across development','Successful aging'] },
        { name:'Theories of development', concepts:['Psychoanalytical theories of development','Behaviouristic theories of development','Cognitive theories of development','Compare stage, learning and cognitive explanations'] },
        { name:'Domains of development', concepts:['Sensory-motor development','Cognitive development','Language development','Emotional development','Social development','Moral development','Compare developmental domains and identify examples'] }
      ]},
      { title:'Psychopathology and assessment', subtopics:[
        { name:'Psychopathology and mental status examination', concepts:['Concept of psychopathology','Mental status examination: purpose and broad components','Classification of psychological disorders','Causes and explanatory approaches','Distinguish description, classification and causal explanation'] }
      ]},
      { title:'Psychotherapies and educational/counselling interventions', subtopics:[
        { name:'Psychotherapies', concepts:['Psychoanalysis','Person-centred therapy','Gestalt therapy','Existential therapy','Acceptance and Commitment Therapy','Behaviour therapy','Rational Emotive Behaviour Therapy','Cognitive Behaviour Therapy','Mindfulness-Based Cognitive Therapy','Play therapy','Positive psychotherapy','Transactional Analysis','Dialectical Behaviour Therapy','Art therapy','Performing arts therapy','Family therapy','Compare therapy goals and core techniques without treating them as interchangeable'] },
        { name:'Educational and school applications', concepts:['Applications of motivation theories in school','Applications of learning theories in school','Factors in educational achievement','Teacher effectiveness','Guidance in schools: needs and organization','Guidance techniques'] },
        { name:'Counselling', concepts:['Counselling process','Core counselling skills','Counselling techniques','Distinguish guidance and counselling'] }
      ]}
    ]},
    { id:'p2-u10', number:10, title:'Emerging Areas', topics:[
      { title:'Social issues and peace psychology', subtopics:[
        { name:'Gender, poverty, disability and migration', concepts:['Gender-related issues in psychology','Poverty and psychological wellbeing','Disability and inclusion','Migration and psychological adjustment','Cultural bias and discrimination','Stigma and marginalization','Social suffering','Child abuse','Domestic violence'] },
        { name:'Peace psychology', concepts:['Violence and non-violence','Conflict resolution at the macro level','Role of media in conflict resolution'] }
      ]},
      { title:'Wellbeing, health and technology', subtopics:[
        { name:'Wellbeing and self-growth', concepts:['Hedonic wellbeing','Eudaimonic wellbeing','Character strengths','Resilience','Post-traumatic growth'] },
        { name:'Health psychology and psychoneuroimmunology', concepts:['Health-promoting behaviours','Health-compromising behaviours','Lifestyle and chronic disease','Diabetes, hypertension and coronary heart disease as examples','Psychoneuroimmunology','Cancer and HIV/AIDS in psychoneuroimmunology contexts'] },
        { name:'Psychology and technology interface', concepts:['Digital learning','Digital etiquette','Cyberbullying','Cyber pornography: consumption and implications','Parental mediation of digital use'] }
      ]}
    ]}
  ];

  const PAPER1_UNITS = [
    { id:'p1-u01', number:1, title:'Teaching Aptitude', topics:[
      { title:'Teaching and learner characteristics', subtopics:[
        { name:'Teaching: concept, objectives and levels', concepts:['Concept and objectives of teaching','Memory, understanding and reflective levels of teaching','Characteristics and basic requirements of teaching'] },
        { name:'Learner characteristics and individual differences', concepts:['Adolescent learner: academic, social, emotional and cognitive characteristics','Adult learner: academic, social, emotional and cognitive characteristics','Individual differences and implications for teaching'] },
        { name:'Factors affecting teaching', concepts:['Teacher-related factors','Learner-related factors','Support material and instructional facilities','Learning environment and institutional factors'] }
      ]},
      { title:'Teaching methods and support systems', subtopics:[
        { name:'Methods in higher learning', concepts:['Teacher-centred methods','Learner-centred methods','Offline and online teaching methods','SWAYAM, SWAYAMPRABHA and MOOCs'] },
        { name:'Teaching support systems', concepts:['Traditional teaching support systems','Modern teaching support systems','ICT-based teaching support systems'] }
      ]},
      { title:'Evaluation systems', subtopics:[
        { name:'Elements and types of evaluation', concepts:['Elements of evaluation','Types of evaluation','Evaluation in the Choice Based Credit System','Computer-based testing','Innovations in evaluation systems'] }
      ]}
    ]},
    { id:'p1-u02', number:2, title:'Research Aptitude', topics:[
      { title:'Research foundations and methods', subtopics:[
        { name:'Meaning, types and characteristics of research', concepts:['Meaning and characteristics of research','Types of research','Positivist and post-positivist approaches'] },
        { name:'Methods and steps of research', concepts:['Experimental method','Descriptive method','Historical method','Qualitative and quantitative methods','Steps of research'] }
      ]},
      { title:'Research communication, ICT and ethics', subtopics:[
        { name:'Thesis and article writing', concepts:['Thesis and article format','Referencing styles and source attribution'] },
        { name:'ICT and research ethics', concepts:['Applications of ICT in research','Research ethics and integrity'] }
      ]}
    ]},
    { id:'p1-u03', number:3, title:'Comprehension', topics:[
      { title:'Reading comprehension', subtopics:[
        { name:'Passage-based understanding and practice', concepts:['Identify the central idea and supporting details','Draw an inference using evidence in a passage','Interpret vocabulary and reference in context','Distinguish what a passage states from an unsupported conclusion'] }
      ]}
    ]},
    { id:'p1-u04', number:4, title:'Communication', topics:[
      { title:'Communication foundations', subtopics:[
        { name:'Meaning, types and characteristics', concepts:['Meaning and process of communication','Types and characteristics of communication'] },
        { name:'Effective communication', concepts:['Verbal communication','Non-verbal communication','Inter-cultural communication','Group communication','Classroom communication'] },
        { name:'Barriers and mass media', concepts:['Barriers to effective communication','Mass media and society'] }
      ]}
    ]},
    { id:'p1-u05', number:5, title:'Mathematical Reasoning and Aptitude', topics:[
      { title:'Reasoning, series and relationships', subtopics:[
        { name:'Types of reasoning', concepts:['Recognize common types of reasoning'] },
        { name:'Series, codes and relationships', concepts:['Number series','Letter series','Codes','Relationships'] }
      ]},
      { title:'Mathematical aptitude', subtopics:[
        { name:'Core arithmetic applications', concepts:['Fractions and operations','Time and distance','Ratio and proportion','Percentages','Profit and loss','Interest and discounting','Averages','Select an efficient calculation strategy and check units'] }
      ]}
    ]},
    { id:'p1-u06', number:6, title:'Logical Reasoning', topics:[
      { title:'Arguments and formal logic', subtopics:[
        { name:'Argument structure and categorical propositions', concepts:['Structure of arguments and argument forms','Categorical propositions','Mood and figure','Classical square of opposition','Formal and informal fallacies'] },
        { name:'Language and reasoning', concepts:['Uses of language in arguments','Connotation and denotation of terms','Deductive versus inductive reasoning','Evaluate the strength of an argument'] },
        { name:'Analogies and Venn diagrams', concepts:['Analogical reasoning','Venn diagrams for validity','Simple and multiple Venn-diagram arguments'] }
      ]},
      { title:'Indian logic', subtopics:[
        { name:'Means of knowledge and pramanas', concepts:['Pratyaksha: perception','Anumana: inference','Upamana: comparison','Shabda: verbal testimony','Arthapatti: implication','Anupalabdhi: non-apprehension'] },
        { name:'Inference and fallacies', concepts:['Structure and kinds of Anumana','Vyapti: invariable relation','Hetvabhasas: fallacies of inference'] }
      ]}
    ]},
    { id:'p1-u07', number:7, title:'Data Interpretation', topics:[
      { title:'Data, representation and interpretation', subtopics:[
        { name:'Sources, acquisition and classification', concepts:['Sources and acquisition of data','Classification of data','Quantitative and qualitative data'] },
        { name:'Graphical representation and mapping', concepts:['Bar charts and tables','Histograms','Pie charts','Line charts','Mapping of data'] },
        { name:'Interpretation and governance', concepts:['Interpret tabular and graphical data','Compare quantities, proportions and trends','Data and governance'] }
      ]}
    ]},
    { id:'p1-u08', number:8, title:'Information and Communication Technology (ICT)', topics:[
      { title:'ICT foundations and applications', subtopics:[
        { name:'Terminology and internet services', concepts:['General ICT abbreviations and terminology','Internet and intranet basics','E-mail concepts and etiquette','Audio and video conferencing'] },
        { name:'Digital initiatives and governance', concepts:['Digital initiatives in higher education','ICT and governance'] }
      ]}
    ]},
    { id:'p1-u09', number:9, title:'People, Development and Environment', topics:[
      { title:'Development and human–environment interaction', subtopics:[
        { name:'Development goals', concepts:['Millennium Development Goals','Sustainable Development Goals'] },
        { name:'Human–environment interaction', concepts:['Human and environment interaction','Anthropogenic activities and environmental impacts'] }
      ]},
      { title:'Environmental issues, resources and protection', subtopics:[
        { name:'Pollution, waste and health', concepts:['Local, regional and global environmental issues','Air, water, soil and noise pollution','Solid, liquid, biomedical, hazardous and electronic waste','Climate change: socioeconomic and political dimensions','Impacts of pollutants on human health'] },
        { name:'Natural and energy resources', concepts:['Solar and wind resources','Soil, hydro and geothermal resources','Biomass, nuclear and forest resources'] },
        { name:'Hazards, laws and agreements', concepts:['Natural hazards and disasters','Disaster mitigation strategies','Environment (Protection) Act, 1986','National Action Plan on Climate Change','Montreal Protocol and Rio Summit','Convention on Biological Diversity and Kyoto Protocol','Paris Agreement and International Solar Alliance'] }
      ]}
    ]},
    { id:'p1-u10', number:10, title:'Higher Education System', topics:[
      { title:'Indian higher education: history and programmes', subtopics:[
        { name:'Institutions and historical development', concepts:['Institutions of higher learning in ancient India','Evolution of higher learning after Independence','Evolution of research in post-Independence India'] },
        { name:'Learning programmes and education types', concepts:['Oriental learning programmes','Conventional learning programmes','Non-conventional learning programmes','Professional, technical and skill-based education'] }
      ]},
      { title:'Values, policies and governance', subtopics:[
        { name:'Education and institutional systems', concepts:['Value education','Environmental education','Policies in higher education','Governance and administration'] }
      ]}
    ]}
  ];

  function slug(value) { return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48); }
  function todayISO(date) { const d = date || new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function minutesFor(title) {
    const s = title.toLowerCase();
    if (/compare|distinguish|interpret|select|apply|evaluate|assumptions|validity|factor analysis|statistical|regression|theor(y|ies)|models/.test(s)) return 12;
    if (/approach|method|design|development|system|process|construction|assessment|analysis|strategy/.test(s)) return 10;
    return 8;
  }
  function priorityFor(unitId, title) {
    if (/p2-u(02|03|04|05|06|07|08|09)/.test(unitId)) return 'High';
    if (/ethic|reliability|validity|research problem|hypothes|sampling|data interpretation|argument|anumana|teaching method/.test(title.toLowerCase())) return 'High';
    return 'Medium';
  }
  function difficultyFor(title, unitId) {
    const s = title.toLowerCase();
    if (/statistics|correlation|regression|factor analysis|anova|manova|ancova|power|effect size|hypothesis|validity|reliability|inference|psychotherap|paradigmatic|metacognitive/.test(s) || unitId==='p2-u02') return 'Tough';
    if (/meaning|types|identify|terms|histor|contribution|abbreviation|definition|characteristics/.test(s)) return 'Easy';
    return 'Moderate';
  }
  function valueFor(unitId, title) {
    if (/p2-u02|p1-u05|p1-u06|p1-u07/.test(unitId) || /calculation|test selection|item difficulty|item discrimination|attitude scale|pramana/.test(title.toLowerCase())) return 'Conceptual foundation';
    if (/p2-u01|p2-u10|researcher|school|theory|test|law|agreement|scale|model/.test(unitId+' '+title.toLowerCase())) return 'Factual recall';
    return 'Scoring potential';
  }
  function targetFor(title) {
    if (/compare|distinguish/.test(title.toLowerCase())) return `Compare ${title.replace(/^compare\s+/i,'').replace(/^distinguish\s+/i,'')} in a two-column note and give one example.`;
    if (/select|match|choose/.test(title.toLowerCase())) return `Choose the appropriate option for a short scenario and explain why it fits.`;
    if (/interpret|evaluate|identify/.test(title.toLowerCase())) return `Explain the idea in your own words, then solve one example without notes.`;
    return `Define ${title.toLowerCase()}, explain its main point, and connect it to one example.`;
  }

  function flattenUnits(units, paper, source, isPsychology) {
    const flat = [];
    units.forEach(unit => unit.topics.forEach((topic, ti) => topic.subtopics.forEach((sub, si) => {
      (sub.concepts || []).forEach((title, ci) => {
        const id = `${unit.id}-${slug(topic.title)}-${slug(sub.name)}-${String(ci+1).padStart(2,'0')}`;
        flat.push({
          id, paper, unitId:unit.id, unitNumber:unit.number, unitTitle:unit.title,
          topic:topic.title, subtopic:sub.name, title,
          learningTarget:targetFor(title), priority:priorityFor(unit.id,title),
          difficulty:difficultyFor(title,unit.id), studyValue:valueFor(unit.id,title),
          estimatedMinutes:minutesFor(title), status:'not_started', mandatory:!/supplementary/i.test(title), sourceType:/supplementary/i.test(title)?'supplementary':'official-or-supporting',
          taskType:'new-learning', notes:'', confidence:0, quizCorrect:'', quizTotal:'',
          lastStudied:'', completedAt:'', nextRevisionDate:'', source,
          plannedDay:null
        });
      });
    })));
    return flat;
  }

  function newPlanTask(planId, day, title, paper, unitId, type, minutes, topic) {
    return { id:`task-${planId}-${day}-${slug(`${paper||'task'}-${unitId||''}-${title}`)}`, title, paper, unitId:unitId||'', topic:topic||'', subtopic:'', taskType:type, estimatedMinutes:minutes||20, done:false, notes:'', source:'', mandatory:false };
  }
  // ---- 15-day revision + practice plan (the only plan in this app) -----------------------------------------
  // `parts` slice a unit's revision topics (1-based, inclusive; `to` is clamped to the unit's topic count at runtime)
  // so a heavy unit can span two days. Days 13-15 are cross-unit practice driven by the learner's own error history.
  const PLAN_15 = [
    { title:'Unit 2 · Research methodology and statistics (1 of 2)', parts:[{unit:2,from:1,to:8}], scope:'units', target:40 },
    { title:'Unit 2 · Research methodology and statistics (2 of 2)', parts:[{unit:2,from:9,to:99}], scope:'units', target:40 },
    { title:'Unit 3 · Psychological testing', parts:[{unit:3,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 5 · Attention, perception, learning and memory (1 of 2)', parts:[{unit:5,from:1,to:7}], scope:'units', target:40 },
    { title:'Unit 5 · Attention, perception, learning and memory (2 of 2)', parts:[{unit:5,from:8,to:99}], scope:'units', target:40 },
    { title:'Unit 4 · Biological basis of behaviour', parts:[{unit:4,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 6 · Thinking, intelligence and creativity', parts:[{unit:6,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 7 · Personality, motivation, emotion and stress', parts:[{unit:7,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 1 · Emergence of psychology', parts:[{unit:1,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 8 · Social psychology', parts:[{unit:8,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 9 · Human development and interventions', parts:[{unit:9,from:1,to:99}], scope:'units', target:40 },
    { title:'Unit 10 · Emerging areas', parts:[{unit:10,from:1,to:99}], scope:'units', target:40 },
    { title:'Repair day · questions you answered wrong', parts:[], scope:'wrong', target:40 },
    { title:'Mock-style mixed set · 50 questions, timed', parts:[], scope:'mixed', target:50, timed:true },
    { title:'Final pass · flashcards, exam traps and last weak spots', parts:[], scope:'wrong', target:40 }
  ];

  function build15DayPlan(concepts) {
    const days = PLAN_15.map((spec, i) => ({
      day:i+1, title:spec.title, dateOverride:'', targetMinutes:210, targetCustomized:false, status:'planned', isRest:false, notes:'',
      conceptIds:[], tasks:[],                       // tasks = only the learner's own custom tasks; revise/flashcard/practice work is derived
      kind:spec.parts.length ? 'revise' : 'practice',
      parts:spec.parts.map(p => ({...p})), focusUnits:[...new Set(spec.parts.map(p => p.unit))],
      practiceScope:spec.scope, practiceTarget:spec.target, timed:!!spec.timed
    }));
    // Link Paper 2 syllabus-checklist concepts to the day(s) that revise their unit (optional cross-reference).
    (concepts || []).forEach(c => { c.plannedDay = null; });
    for (let n = 1; n <= 10; n++) {
      const group = (concepts || []).filter(c => c.paper === 'Paper 2' && c.unitNumber === n);
      const homes = days.filter(d => d.focusUnits.includes(n));
      group.forEach((c, i) => { const d = homes[Math.min(homes.length - 1, Math.floor(i * homes.length / group.length))]; if (d) { d.conceptIds.push(c.id); c.plannedDay = d.day; } });
    }
    return days;
  }

  function createInitialState() {
    const concepts=[...flattenUnits(PSY_UNITS,'Paper 2',PSY_SOURCE,true),...flattenUnits(PAPER1_UNITS,'Paper 1',PAPER1_SOURCE,false)];
    return {
      schemaVersion:3,
      createdAt:new Date().toISOString(),
      settings:{
        startDate:todayISO(), examDate:'', activePlan:'15', theme:'light',
        dailyTargetMinutes:210, paper1TargetMinutes:0, paper2TargetMinutes:210,
        revisionIntervals:[1,3,7,14], marksPerCorrect:2, negativeMarks:0,
        syllabusCheckedOn:'2026-10-10', showSupplementaryLabels:true
      },
      concepts,
      plans:{'15':build15DayPlan(concepts)},
      revisions:[], sessions:[], timer:{status:'stopped',startedAt:null,elapsedMs:0,paper:'Paper 2',category:'new-learning',unitId:'',planId:'15',day:1},
      pyqs:[], mockTests:[], notes:[], unitNotes:{}, topicNotes:{}, planNotes:{}, dayDateOverrides:{},
      cardReviews:{}, qStats:{}, topicRevised:{}, quizHistory:[], dayPractice:{}, activeQuiz:null,
      ui:{activePlan:'15'}
    };
  }

  const api={PAPER1_SOURCE,PSY_SOURCE,OFFICIAL_PAGE,PSY_UNITS,PAPER1_UNITS,PLAN_15,createInitialState,build15DayPlan,slug,todayISO};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  root.StudyData=api;
})(typeof window!=='undefined'?window:globalThis);
