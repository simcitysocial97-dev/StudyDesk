/* UGC NET study tracker seed data. Syllabus wording is structured from the official UGC NET Paper I and Psychology (04) PDFs; planning labels are estimates. */
(function (root) {
  'use strict';
  const PAPER1_SOURCE = 'https://www.ugcnetonline.in/showPdf.php?p1=NTA_All_R_Syllabus/00-Paper-I/Paper-I_English.pdf';
  const PSY_SOURCE = 'https://www.ugcnetonline.in/NTA_All_R_Syllabus/04/Psychology_English.pdf';
  const OFFICIAL_PAGE = 'https://www.ugcnetonline.in/syllabus-new.php';

  // Each subtopic explicitly names the supplied 60-day plan day to preserve its priority order.
  const PSY_UNITS = [
    { id:'p2-u01', number:1, title:'Emergence of Psychology', topics:[
      { title:'Eastern and Indian psychology', subtopics:[
        { name:'Psychological thought in major Eastern systems', day:50, concepts:['Bhagavad Gita: psychological ideas and human action','Buddhist perspectives on mind, suffering and change','Sufi perspectives on self and inner development','Integral Yoga and psychological development'] },
        { name:'Academic psychology in India', day:50, concepts:['Pre-independence academic psychology in India','Post-independence development of psychology','1970s shift toward addressing social issues','1980s indigenization movement','1990s paradigmatic concerns and disciplinary identity crisis','2000s emergence of Indian psychology in academia','Colonial encounter and its influence on psychology','Post-colonialism and psychology','Question of a distinct disciplinary identity'] },
        { name:'Indic influences and knowledge traditions', day:50, concepts:['Indic influences on modern psychology','Yoga as a psychological knowledge tradition','Bhagavad Gita as a source of psychological knowledge','Buddhist, Sufi and Integral Yoga perspectives','Science and spirituality: avidya and vidya','Primacy of self-knowledge in Indian psychology'] }
      ]},
      { title:'Western emergence and schools of psychology', subtopics:[
        { name:'Historical foundations', day:49, concepts:['Greek heritage in psychological thought','Medieval contributions to psychological thought','Modern period and the emergence of psychology','Wundt and the experimental path to academic psychology','Freud and the psychoanalytic path','William James and the functional path','Dilthey and the human-science path'] },
        { name:'Major schools and movements', day:49, concepts:['Structuralism','Functionalism','Psychoanalytical school','Gestalt psychology','Behaviourism','Humanistic-existential psychology','Transpersonal psychology','Cognitive revolution','Multiculturalism in psychology'] },
        { name:'Historical and paradigmatic issues', day:49, concepts:['Crisis arising from strict experimental-analytical approaches','Logical empiricism and its influence on psychology','Limits of a single experimental-analytical paradigm'] }
      ]},
      { title:'Paradigms of psychological knowledge', subtopics:[
        { name:'Essential aspects of a knowledge paradigm', day:50, concepts:['Ontology: assumptions about what exists','Epistemology: assumptions about knowledge','Methodology: how knowledge is produced','Distinguish ontology, epistemology and methodology'] },
        { name:'Western paradigms', day:50, concepts:['Positivism','Post-positivism','Critical perspective','Social constructionism','Existential phenomenology','Co-operative enquiry','Paradigmatic controversies in psychology'] }
      ]}
    ]},
    { id:'p2-u02', number:2, title:'Research Methodology and Statistics', topics:[
      { title:'Research foundations', subtopics:[
        { name:'Meaning, purpose and dimensions of research', day:1, concepts:['Meaning of research','Purpose of psychological research','Dimensions and scope of research','Basic research terminology'] },
        { name:'Research problems and variables', day:2, concepts:['Identify and formulate a research problem','Independent and dependent variables','Extraneous, confounding and control variables','Operational definitions','Distinguish a construct from its operational definition'] },
        { name:'Hypotheses', day:2, concepts:['Null and alternative hypotheses','Directional and non-directional hypotheses','Translate a research question into a testable hypothesis'] },
        { name:'Sampling', day:3, concepts:['Target population and sampling frame','Probability and non-probability sampling','Common probability sampling approaches','Common non-probability sampling approaches','Sampling error and sources of bias'] },
        { name:'Research ethics and reporting', day:3, concepts:['Informed consent and voluntary participation','Confidentiality and privacy','Deception and debriefing','Research integrity, plagiarism and responsible reporting','Ethical conduct with human participants'] }
      ]},
      { title:'Research paradigms and methods', subtopics:[
        { name:'Research paradigms', day:4, concepts:['Quantitative research: purpose and evidence','Qualitative research: purpose and evidence','Mixed-methods approach','Choose a paradigm to fit a research question'] },
        { name:'Observation, surveys and field methods', day:4, concepts:['Observation methods','Survey research','Interview method','Questionnaire method','Field studies'] },
        { name:'Experimental and comparative methods', day:5, concepts:['Experimental research method','Quasi-experimental research method','Cross-cultural studies','Case study method','Single-case approaches'] },
        { name:'Qualitative methods', day:5, concepts:['Phenomenology as a research method','Grounded theory','Focus groups','Narrative method','Ethnography'] }
      ]},
      { title:'Statistics and statistical inference', subtopics:[
        { name:'Descriptive statistics', day:6, concepts:['Mean and when it is informative','Median and when it is informative','Mode and its uses','Range','Variance','Standard deviation','Percentiles and percentile ranks','Interpret descriptive statistics in a short dataset'] },
        { name:'Normal probability curve', day:6, concepts:['Properties of the normal probability curve','Standard scores and relative position','Interpret area and score location conceptually'] },
        { name:'Parametric testing and t-test logic', day:7, concepts:['Purpose of a t-test','Match common t-test situations to a design','Statistical significance and the null hypothesis','p-value interpretation without equating significance with importance'] },
        { name:'Power and effect size', day:7, concepts:['Effect size: magnitude of an observed effect','Statistical power and its meaning','Factors that affect power','Distinguish statistical significance from practical importance'] },
        { name:'Non-parametric tests', day:8, concepts:['When a non-parametric test is appropriate','Sign test','Wilcoxon signed-rank test','Mann–Whitney test','Kruskal–Wallis test','Friedman test','Select a non-parametric test for independent versus related groups'] }
      ]},
      { title:'Correlation, regression and factor analysis', subtopics:[
        { name:'Correlation methods', day:9, concepts:['Pearson product-moment correlation','Rank-order correlation','Partial correlation','Multiple correlation','Biserial correlation','Point-biserial correlation','Tetrachoric correlation','Phi coefficient','Interpret direction and strength of a correlation','Correlation does not establish causation'] },
        { name:'Regression', day:9, concepts:['Simple linear regression','Multiple regression','Prediction versus causal explanation','Interpret a regression coefficient conceptually'] },
        { name:'Factor analysis', day:11, concepts:['Purpose and assumptions of factor analysis','Factor extraction methods: overview','Factor rotation and its purpose','Interpret factor loadings and factor solutions'] }
      ]},
      { title:'Experimental and advanced research designs', subtopics:[
        { name:'Experimental design foundations', day:5, concepts:['Experimental versus quasi-experimental design','Control and comparison groups','Random assignment','Internal validity and threats','External validity and generalization','Distinguish random sampling from random assignment'] },
        { name:'ANOVA and repeated designs', day:10, concepts:['One-way ANOVA: question answered','Factorial ANOVA: factors and levels','Main effects','Interaction effects','Randomized block design','Repeated-measures design','Match an ANOVA design to a research scenario'] },
        { name:'Advanced designs', day:11, concepts:['Latin square design','Cohort studies','Time-series design','MANOVA: multivariate outcomes','ANCOVA: covariate adjustment','Single-subject research designs','Recognize design strengths and limitations'] }
      ]}
    ]},
    { id:'p2-u03', number:3, title:'Psychological Testing', topics:[
      { title:'Test foundations and construction', subtopics:[
        { name:'Types and uses of psychological tests', day:12, concepts:['Individual and group tests','Objective and performance-based approaches','Speed and power tests','Ability, typical-performance and self-report formats','Choose a test format to fit an assessment purpose'] },
        { name:'Test construction and item analysis', day:12, concepts:['Define the construct and test blueprint','Write clear and unbiased items','Item difficulty','Item discrimination','Distractor analysis for selected-response items','Use item analysis to revise a test'] }
      ]},
      { title:'Standardization and psychometric quality', subtopics:[
        { name:'Standardization and norms', day:13, concepts:['Standardized administration and scoring','Norm-referenced interpretation','Criterion-referenced interpretation','Types and uses of norms','Norm groups and limitations of norm comparisons'] },
        { name:'Reliability', day:13, concepts:['Test–retest reliability','Split-half reliability','Internal consistency','Inter-rater reliability','Sources of measurement error','Factors that affect reliability'] },
        { name:'Validity', day:13, concepts:['Content validity','Criterion-related validity','Construct validity','Evidence for validity','Factors that affect validity','Reliability as a requirement but not proof of validity','Distinguish reliability from validity'] }
      ]},
      { title:'Assessment areas and applications', subtopics:[
        { name:'Major areas of testing', day:14, concepts:['Intelligence tests','Creativity tests','Neuropsychological tests','Aptitude tests','Personality assessment','Interest inventories','Match an assessment area to a referral question'] },
        { name:'Attitude scales and computer-based testing', day:15, concepts:['Likert scale','Semantic differential scale','Stapel scale','Computer-based psychological testing','Strengths and limitations of computer-based assessment'] },
        { name:'Applications of psychological testing', day:15, concepts:['Clinical settings','Organizational and business settings','Educational settings','Counselling settings','Military settings','Career guidance','Ethical interpretation and communication of test results'] }
      ]}
    ]},
    { id:'p2-u04', number:4, title:'Biological Basis of Behavior', topics:[
      { title:'Neural structure and communication', subtopics:[
        { name:'Neurons and neural impulse', day:16, concepts:['Neuron structure and major parts','Types of neurons','Neuron functions','Resting potential and neural impulse','Action potential sequence','All-or-none principle'] },
        { name:'Synaptic transmission and neurotransmitters', day:16, concepts:['Synaptic transmission sequence','Excitatory and inhibitory postsynaptic effects','Reuptake and enzymatic breakdown','Major neurotransmitters and broad functions','Distinguish neurotransmitters from hormones'] }
      ]},
      { title:'Nervous system and neuroplasticity', subtopics:[
        { name:'Central and peripheral nervous systems', day:17, concepts:['Central nervous system: brain and spinal cord','Peripheral nervous system overview','Somatic nervous system','Autonomic nervous system','Sympathetic and parasympathetic divisions','Major brain structures and broad functions'] },
        { name:'Neuroplasticity', day:17, concepts:['Neuroplasticity and neural change','Experience-dependent plasticity','Plasticity across development and recovery'] }
      ]},
      { title:'Physiological psychology methods', subtopics:[
        { name:'Invasive methods', day:18, concepts:['Anatomical methods','Degeneration techniques','Lesion techniques','Chemical methods','Microelectrode studies','Compare what invasive methods can reveal and their limitations'] },
        { name:'Non-invasive methods', day:18, concepts:['EEG and the signal it records','Scanning methods: broad categories','Match a physiological question to an appropriate method','Limits of inferring mental processes from physiological measures'] }
      ]},
      { title:'Sensory, muscular and glandular systems', subtopics:[
        { name:'Sensory systems', day:19, concepts:['General sensations','Specific sensations','Sensory receptors and their functions','Sensory transduction and processing','Receptor-to-perception sequence'] },
        { name:'Muscular and glandular systems', day:19, concepts:['Types and functions of muscular systems','Glandular system: major types and functions','Endocrine glands and major hormones','Distinguish nervous and endocrine signalling'] }
      ]},
      { title:'Biological motivation, emotion and genetics', subtopics:[
        { name:'Biological bases of motivation', day:20, concepts:['Biological basis of hunger','Biological basis of thirst','Sleep and biological regulation','Biological basis of sex'] },
        { name:'Emotion and genetic influences', day:20, concepts:['Limbic system and emotion','Hormonal regulation of behaviour','Chromosomal anomalies and behaviour','Nature–nurture controversy','Twin studies as evidence','Adoption studies as evidence','Limits of genetic inference from family designs'] }
      ]}
    ]},
    { id:'p2-u05', number:5, title:'Attention, Perception, Learning, Memory and Forgetting', topics:[
      { title:'Attention', subtopics:[
        { name:'Forms and models of attention', day:21, concepts:['Selective attention','Divided attention','Sustained attention','Other forms of attention and task demands','Major models of attention','Compare assumptions of attention models'] }
      ]},
      { title:'Perception', subtopics:[
        { name:'Approaches and perceptual organization', day:22, concepts:['Gestalt approach to perception','Physiological approach to perception','Figure and ground','Gestalt laws of organization','Perceptual grouping principles','Size constancy','Shape constancy','Colour constancy','Visual illusions and their interpretation'] },
        { name:'Form, depth and movement', day:23, concepts:['Perception of form','Monocular and binocular depth cues','Perception of movement','Pattern recognition'] },
        { name:'Signal detection and advanced perspectives', day:23, concepts:['Signal detection theory assumptions','Sensitivity and decision criterion','Applications of signal detection theory','Subliminal perception and related factors','Information-processing approach to perception','Role of motivation and learning in perception','Culture and perception','Perceptual styles','Ecological perspective on perception'] }
      ]},
      { title:'Learning', subtopics:[
        { name:'Fundamental learning theories', day:24, concepts:['Thorndike: law of effect and connectionism','Guthrie: contiguity theory','Hull: drive-reduction and neobehaviourist approach','Compare Thorndike, Guthrie and Hull','Use a learning theory to explain a simple example'] },
        { name:'Classical conditioning', day:25, concepts:['Classical conditioning procedure and terminology','Acquisition, extinction and spontaneous recovery','Generalization and discrimination','Higher-order conditioning and related phenomena','Classical-conditioning theoretical issues'] },
        { name:'Instrumental learning and reinforcement', day:25, concepts:['Instrumental learning paradigms','Instrumental-learning phenomena and theoretical issues','Positive and negative reinforcement','Reinforcement versus punishment','Basic reinforcement variables','Continuous and intermittent reinforcement','Fixed and variable schedules','Behaviour modification and applications'] },
        { name:'Cognitive, verbal and recent learning approaches', day:25, concepts:['Latent learning','Observational learning','Verbal learning','Discrimination learning','Neurophysiology of learning: recent trends'] }
      ]},
      { title:'Memory and forgetting', subtopics:[
        { name:'Memory processes and systems', day:26, concepts:['Encoding, storage and retrieval','Sensory memory','Short-term memory','Working memory','Long-term declarative memory','Episodic and semantic memory','Procedural memory','Compare major memory systems'] },
        { name:'Theories of forgetting', day:26, concepts:['Interference theory','Retrieval failure','Decay theory','Motivated forgetting','Distinguish explanations of forgetting using examples'] }
      ]}
    ]},
    { id:'p2-u06', number:6, title:'Thinking, Intelligence and Creativity', topics:[
      { title:'Thinking, concepts and reasoning', subtopics:[
        { name:'Theoretical perspectives on thought', day:27, concepts:['Associationism and thought','Gestalt perspective on thinking','Information-processing perspective','Feature integration model','Compare major approaches to thought processes'] },
        { name:'Concept formation and reasoning', day:28, concepts:['Concept formation: rules','Concept types and strategies','Role of concepts in thinking','Deductive reasoning','Inductive reasoning','Other types of reasoning in the syllabus context','Language and thought relationships'] }
      ]},
      { title:'Problem-solving, decision-making and metacognition', subtopics:[
        { name:'Problem-solving', day:29, concepts:['Types of problems','Problem-solving strategies','Obstacles to problem-solving','Identify strategy and obstacle in a scenario'] },
        { name:'Decision-making', day:29, concepts:['Types of decisions','Decision-making models','Heuristics and biases as supplementary application examples','Distinguish problem-solving from decision-making'] },
        { name:'Metacognition', day:31, concepts:['Metacognitive knowledge','Metacognitive regulation','Planning, monitoring and evaluating one’s thinking'] }
      ]},
      { title:'Intelligence', subtopics:[
        { name:'Theories and models of intelligence', day:30, concepts:['Spearman and general intelligence','Thurstone and primary mental abilities','Jensen’s theory of intelligence','Cattell: fluid and crystallized abilities','Gardner’s multiple intelligences','Sternberg’s triarchic theory','Goleman and emotional intelligence','Das, Kar and Parrila: PASS model','Compare the distinctive claims of intelligence theories'] }
      ]},
      { title:'Creativity', subtopics:[
        { name:'Theories and assessment of creativity', day:31, concepts:['Guilford and divergent production','Torrance and creative thinking assessment','Getzels and Jackson','Wallach and Kogan','Relationship between intelligence and creativity','Compare creativity theories and assessment approaches'] }
      ]}
    ]},
    { id:'p2-u07', number:7, title:'Personality, Motivation, Emotion, Stress and Coping', topics:[
      { title:'Personality', subtopics:[
        { name:'Psychoanalytic and neo-Freudian approaches', day:32, concepts:['Psychoanalytical approach to personality','Freud: core psychoanalytic constructs and mechanisms','Neo-Freudian approaches and distinctive emphases','Compare Freud with major neo-Freudian approaches'] },
        { name:'Determinants and trait/type approaches', day:33, concepts:['Biological determinants of personality','Socio-cultural determinants of personality','Trait approach','Type approach','Compare trait and type approaches'] },
        { name:'Social-learning, cognitive and humanistic approaches', day:34, concepts:['Social-learning approach to personality','Cognitive approach to personality','Humanistic approach','Existential approach','Transpersonal approach','Rotter’s locus of control','Seligman’s explanatory style','Kohlberg’s theory of moral development','Match a personality approach to an assessment or scenario'] }
      ]},
      { title:'Motivation', subtopics:[
        { name:'Basic concepts and motivational cycle', day:35, concepts:['Instincts','Needs','Drives','Arousal','Incentives','Motivational cycle','Distinguish needs, drives, arousal and incentives'] },
        { name:'Approaches to motivation', day:35, concepts:['Psychoanalytical approach to motivation','Ethological approach','Stimulus–response approach','Cognitive approach','Humanistic approach','Compare major motivational perspectives'] },
        { name:'Specific motives and self-regulation', day:36, concepts:['Exploratory behaviour and curiosity','Zuckerman’s sensation seeking','Achievement motivation','Affiliation motivation','Power motivation','Motivational competence','Self-regulation','Flow'] }
      ]},
      { title:'Emotion, conflict, stress and coping', subtopics:[
        { name:'Emotion and emotion regulation', day:36, concepts:['Physiological correlates of emotion','James–Lange theory','Cannon–Bard theory','Schachter–Singer two-factor theory','Lazarus cognitive appraisal theory','Lindsley activation theory','Compare major theories of emotion','Emotion regulation'] },
        { name:'Conflict, stress and coping', day:37, concepts:['Sources of conflict','Types of conflict','Concept of stress','Models of stress','Type A, B, C and D behaviour patterns','Coping and stress management principles'] },
        { name:'Stress-management strategies', day:37, concepts:['Biofeedback','Music therapy','Breathing exercises','Progressive muscular relaxation','Guided imagery','Mindfulness','Meditation','Yogasana','Stress inoculation training','Match a stress-management method with its principle'] }
      ]}
    ]},
    { id:'p2-u08', number:8, title:'Social Psychology', topics:[
      { title:'Foundations and theories', subtopics:[
        { name:'Nature, scope and history', day:38, concepts:['Nature and scope of social psychology','Historical development of social psychology','Person–situation and social-context perspectives'] },
        { name:'Traditional theoretical perspectives', day:38, concepts:['Field theory','Cognitive dissonance theory','Sociobiological approach','Psychodynamic approaches','Social cognition','Compare the questions addressed by major perspectives'] }
      ]},
      { title:'Social perception, attitudes and prosocial behaviour', subtopics:[
        { name:'Social perception and communication', day:39, concepts:['Social communication','Attribution processes','Attributional explanations and bias as applications','Interpret social behaviour in context'] },
        { name:'Attitudes and prosocial behaviour', day:39, concepts:['Attitude structure','Attitude change','Attitudes within cultural context','Persuasion processes','Prosocial behaviour','Distinguish prosocial behaviour from compliance'] }
      ]},
      { title:'Groups and social influence', subtopics:[
        { name:'Group processes', day:40, concepts:['Social facilitation','Social loafing','Group dynamics','Leadership styles','Leadership effectiveness'] },
        { name:'Social influence and aggression', day:40, concepts:['Conformity','Peer pressure','Persuasion','Compliance','Obedience','Social power','Reactance','Aggression','Distinguish conformity, compliance, obedience and persuasion'] }
      ]},
      { title:'Intergroup relations and applications', subtopics:[
        { name:'Theories of intergroup relations', day:41, concepts:['Minimal group experiment','Social Identity Theory','Relative Deprivation Theory','Realistic Conflict Theory','Balance theories','Equity theory','Social Exchange Theory','Compare explanations of group identity and intergroup conflict'] },
        { name:'Applied social psychology', day:41, concepts:['Applications to health','Applications to environment','Applications to law','Personal space','Crowding','Territoriality'] }
      ]}
    ]},
    { id:'p2-u09', number:9, title:'Human Development and Interventions', topics:[
      { title:'Human development', subtopics:[
        { name:'Developmental processes and successful aging', day:42, concepts:['Meaning of development','Principles of development','Factors in development','Stages of development','Nature and nurture across development','Successful aging'] },
        { name:'Theories of development', day:43, concepts:['Psychoanalytical theories of development','Behaviouristic theories of development','Cognitive theories of development','Compare stage, learning and cognitive explanations'] },
        { name:'Domains of development', day:44, concepts:['Sensory-motor development','Cognitive development','Language development','Emotional development','Social development','Moral development','Compare developmental domains and identify examples'] }
      ]},
      { title:'Psychopathology and assessment', subtopics:[
        { name:'Psychopathology and mental status examination', day:45, concepts:['Concept of psychopathology','Mental status examination: purpose and broad components','Classification of psychological disorders','Causes and explanatory approaches','Distinguish description, classification and causal explanation'] }
      ]},
      { title:'Psychotherapies and educational/counselling interventions', subtopics:[
        { name:'Psychotherapies', day:46, concepts:['Psychoanalysis','Person-centred therapy','Gestalt therapy','Existential therapy','Acceptance and Commitment Therapy','Behaviour therapy','Rational Emotive Behaviour Therapy','Cognitive Behaviour Therapy','Mindfulness-Based Cognitive Therapy','Play therapy','Positive psychotherapy','Transactional Analysis','Dialectical Behaviour Therapy','Art therapy','Performing arts therapy','Family therapy','Compare therapy goals and core techniques without treating them as interchangeable'] },
        { name:'Educational and school applications', day:46, concepts:['Applications of motivation theories in school','Applications of learning theories in school','Factors in educational achievement','Teacher effectiveness','Guidance in schools: needs and organization','Guidance techniques'] },
        { name:'Counselling', day:46, concepts:['Counselling process','Core counselling skills','Counselling techniques','Distinguish guidance and counselling'] }
      ]}
    ]},
    { id:'p2-u10', number:10, title:'Emerging Areas', topics:[
      { title:'Social issues and peace psychology', subtopics:[
        { name:'Gender, poverty, disability and migration', day:47, concepts:['Gender-related issues in psychology','Poverty and psychological wellbeing','Disability and inclusion','Migration and psychological adjustment','Cultural bias and discrimination','Stigma and marginalization','Social suffering','Child abuse','Domestic violence'] },
        { name:'Peace psychology', day:48, concepts:['Violence and non-violence','Conflict resolution at the macro level','Role of media in conflict resolution'] }
      ]},
      { title:'Wellbeing, health and technology', subtopics:[
        { name:'Wellbeing and self-growth', day:48, concepts:['Hedonic wellbeing','Eudaimonic wellbeing','Character strengths','Resilience','Post-traumatic growth'] },
        { name:'Health psychology and psychoneuroimmunology', day:48, concepts:['Health-promoting behaviours','Health-compromising behaviours','Lifestyle and chronic disease','Diabetes, hypertension and coronary heart disease as examples','Psychoneuroimmunology','Cancer and HIV/AIDS in psychoneuroimmunology contexts'] },
        { name:'Psychology and technology interface', day:48, concepts:['Digital learning','Digital etiquette','Cyberbullying','Cyber pornography: consumption and implications','Parental mediation of digital use'] }
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

  const P2_DAY_INFO = {
    1:'Research foundations: meaning, purpose, dimensions and terminology',2:'Variables, operational definitions and hypotheses',3:'Sampling and research ethics',4:'Research paradigms and methods',5:'Experimental, quasi-experimental and other designs',6:'Descriptive statistics and the normal probability curve',7:'Correlation and statistical inference',8:'Non-parametric tests',9:'Advanced correlation and regression',10:'Experimental designs and ANOVA',11:'Advanced designs and factor analysis',12:'Testing foundations and construction',13:'Standardization, reliability and validity',14:'Major assessment areas',15:'Scales, computer-based tests and applications',16:'Neurons and neural transmission',17:'Neurotransmitters, nervous system and neuroplasticity',18:'Physiological methods',19:'Sensory, muscular and glandular systems',20:'Biological motivation, emotion and genetics',21:'Attention',22:'Perceptual organization',23:'Advanced perception',24:'Fundamental learning theories',25:'Conditioning, reinforcement and learning approaches',26:'Memory and forgetting',27:'Theories of thinking',28:'Concepts, reasoning and language',29:'Problem-solving and decisions',30:'Intelligence theories',31:'Creativity and metacognition',32:'Psychoanalytic and neo-Freudian personality approaches',33:'Trait, type and biological approaches',34:'Social-learning, cognitive and humanistic approaches',35:'Motivation theories',36:'Achievement, emotion and self-regulation',37:'Stress, coping and conflict',38:'Foundations and social cognition',39:'Social perception, attitudes and prosocial behaviour',40:'Social influence, groups and aggression',41:'Intergroup relations and applications',42:'Developmental foundations and successful aging',43:'Developmental theories',44:'Developmental domains',45:'Psychopathology and assessment',46:'Psychotherapies, counselling and educational applications',47:'Emerging areas: society and inequality',48:'Emerging areas: wellbeing, health and technology',49:'Emergence of psychology: Western foundations',50:'Emergence of psychology: Indian traditions and paradigms',51:'Unit 2: research and statistics PYQs + error repair',52:'Unit 3: psychological testing PYQs + review',53:'Units 4–5: biological bases, learning and memory review',54:'Unit 6: thinking, intelligence and creativity review',55:'Unit 7: personality, motivation, emotion and coping review',56:'Unit 8: social psychology PYQs + review',57:'Units 9–10: development, interventions and emerging areas',58:'Unit 1: history, Indian psychology and mixed Paper 2 practice',59:'Timed Paper 2 practice test (100 questions)',60:'Final consolidation: error log, formulas and comparison sheets'
  };

  const PAPER1_BLOCKS = [
    { unitId:'p1-u02', start:1, end:5 },   // Research aptitude first
    { unitId:'p1-u05', start:6, end:10 },  // Mathematical reasoning
    { unitId:'p1-u07', start:11, end:15 }, // Data interpretation
    { unitId:'p1-u06', start:16, end:20 }, // Logical reasoning
    { unitId:'p1-u01', start:21, end:25 }, // Teaching aptitude
    { unitId:'p1-u04', start:26, end:28 }, // Communication
    { unitId:'p1-u08', start:29, end:31 }, // ICT
    { unitId:'p1-u09', start:32, end:34 }, // People and environment
    { unitId:'p1-u10', start:35, end:36 }, // Higher education
    { unitId:'p1-u03', start:37, end:38 }  // Comprehension
  ];

  const EMERGENCY_P2_FOCUS = {
    1:[['p2-u02',1,5,13]],
    2:[['p2-u02',6,7,10],['p2-u03',12,13,7]],
    3:[['p2-u02',8,11,12],['p2-u03',14,15,6]],
    4:[['p2-u04',16,17,12],['p2-u05',21,22,5]],
    5:[['p2-u04',18,20,12],['p2-u05',23,23,5]],
    6:[['p2-u07',32,36,14]],
    7:[['p2-u08',38,41,14]],
    8:[['p2-u05',24,26,8],['p2-u06',27,31,10]],
    9:[['p2-u06',27,31,12]],
    10:[['p2-u09',42,45,12]],
    11:[['p2-u09',46,46,15]],
    12:[['p2-u01',49,50,12],['p2-u10',47,48,8]]
  };

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
          plannedDay:isPsychology ? sub.day : null
        });
      });
    })));
    return flat;
  }

  function distributePaper1Days(concepts) {
    PAPER1_BLOCKS.forEach(block => {
      const group = concepts.filter(c => c.unitId===block.unitId);
      const count = block.end-block.start+1;
      group.forEach((c, i) => { c.plannedDay = block.start + Math.min(count-1, Math.floor(i*count/Math.max(1,group.length))); });
    });
  }
  function newPlanTask(planId, day, title, paper, unitId, type, minutes, topic) {
    return { id:`task-${planId}-${day}-${slug(`${paper||'task'}-${unitId||''}-${title}`)}`, title, paper, unitId:unitId||'', topic:topic||'', subtopic:'', taskType:type, estimatedMinutes:minutes||20, done:false, notes:'', source:'', mandatory:false };
  }
  const P2_REVIEW = {
    51:[['p2-u02','Mixed research-methodology questions and statistics test selection','pyq',65],['p2-u02','Redo incorrect calculations; record why each answer was wrong','revision',25]],
    52:[['p2-u03','PYQs: reliability, validity, norms and test construction','pyq',60],['p2-u03','Review assessment-type and scale comparison sheet','revision',25]],
    53:[['p2-u04','Biological-bases retrieval: structures, systems and neurotransmitters','revision',35],['p2-u05','PYQs: attention, learning, memory and forgetting','pyq',55]],
    54:[['p2-u06','Timed questions: thinking, intelligence, reasoning and creativity','pyq',70],['p2-u06','Repair confused theorist comparisons','revision',25]],
    55:[['p2-u07','PYQs: personality, motivation, emotion and stress','pyq',65],['p2-u07','Retrieve coping methods and emotion-theory contrasts','revision',25]],
    56:[['p2-u08','PYQs: attitudes, social influence, groups and intergroup relations','pyq',70]],
    57:[['p2-u09','PYQs: development, psychopathology, therapies and counselling','pyq',55],['p2-u10','Review wellbeing, health, technology and social-issue concepts','revision',30]],
    58:[['p2-u01','Timeline and paradigms recall: Western and Indian psychology','revision',35],['p2-u01','Timed mixed Paper 2 question set; log every error','pyq',55]]
  };
  const P1_PRACTICE_ROTATION = [
    ['p1-u05','Quantitative reasoning: short cumulative practice','practice'],
    ['p1-u06','Logical reasoning: argument and inference practice','practice'],
    ['p1-u07','Data interpretation: timed table/chart set','practice'],
    ['p1-u03','Comprehension: one passage and evidence-based answers','practice']
  ];

  function getSubtopicMap(concepts) {
    const map = new Map();
    concepts.forEach(c => { const k=`${c.unitId}|${c.subtopic}`; if(!map.has(k)) map.set(k,[]); map.get(k).push(c); });
    return map;
  }
  function build60DayPlan(allConcepts) {
    const paper2 = allConcepts.filter(c=>c.paper==='Paper 2');
    const paper1 = allConcepts.filter(c=>c.paper==='Paper 1');
    const days = [];
    for(let n=1;n<=60;n++) {
      const p2Ids = paper2.filter(c=>c.plannedDay===n).map(c=>c.id);
      const p1Ids = paper1.filter(c=>c.plannedDay===n).map(c=>c.id);
      const tasks=[];
      if(n>=51 && n<=58) (P2_REVIEW[n]||[]).forEach(([unitId,title,type,mins])=>tasks.push(newPlanTask('60',n,title,'Paper 2',unitId,type,mins)));
      if(n===59) tasks.push(newPlanTask('60',n,'Timed Paper 2 practice test (100 questions); analyse errors after the attempt','Paper 2','p2-u02','mock',120));
      if(n===60) tasks.push(newPlanTask('60',n,'Final Paper 2 consolidation: error log, formulas, comparison sheets and weak concepts','Paper 2','','consolidation',80));
      const [p1Unit,p1Title,p1Type] = P1_PRACTICE_ROTATION[(n-1)%P1_PRACTICE_ROTATION.length];
      tasks.push(newPlanTask('60',n,p1Title,'Paper 1',p1Unit,'practice',n>=51?20:15));
      if(n>=39 && n<=50 && n%2===0) tasks.push(newPlanTask('60',n,'Cumulative Paper 1 mini-set: revisit one previously covered unit','Paper 1',p1Unit,'revision',10));
      if(n===59) tasks.push(newPlanTask('60',n,'Paper 1 quick timed section and review (keep within the daily target)','Paper 1','','practice',20));
      if(n===60) tasks.push(newPlanTask('60',n,'Paper 1 final recall: definitions, formulas and error log','Paper 1','','revision',20));
      days.push({ day:n, title:P2_DAY_INFO[n], dateOverride:'', targetMinutes:210, targetCustomized:false, status:'planned', isRest:false, notes:'', conceptIds:[...p2Ids,...p1Ids], tasks });
    }
    return days;
  }
  function distributeFromRange(concepts, unitId, start, end, max) {
    let picked = concepts.filter(c=>c.unitId===unitId && c.plannedDay>=start && c.plannedDay<=end);
    // Prefer early concepts in syllabus order; the emergency plan is selective by design.
    if (picked.length>max) picked=picked.slice(0,max);
    return picked.map(c=>c.id);
  }
  function build15DayPlan(allConcepts) {
    const p2 = allConcepts.filter(c=>c.paper==='Paper 2');
    const p1 = allConcepts.filter(c=>c.paper==='Paper 1');
    const planInfo = [
      'Research methodology and foundations','Research designs, statistics and psychological testing','Testing, reliability, validity and advanced methods',
      'Learning, memory, biological bases and perception','Biological methods, perception and learning consolidation','Personality, motivation, emotion and stress',
      'Social psychology: attitudes, influence and groups','Consolidate core areas + thinking and intelligence','Thinking/intelligence + mixed core-area revision',
      'Human development, psychopathology and assessment','Psychotherapies, counselling and applied psychology','Historical foundations and emerging areas',
      'Mixed Psychology PYQs and error repair','Timed Paper 1 + Paper 2 practice','Final selective revision and logistics'
    ];
    const days=[];
    const p1Sets={
      1:['p1-u02'],2:['p1-u01'],3:['p1-u05'],4:['p1-u07'],5:['p1-u06'],6:['p1-u04','p1-u03'],7:['p1-u08'],8:['p1-u09'],9:['p1-u10'],
      10:['p1-u01','p1-u02','p1-u05','p1-u07','p1-u06'],11:['p1-u03','p1-u04','p1-u08','p1-u09','p1-u10'],12:['p1-u01','p1-u02','p1-u03','p1-u04','p1-u05','p1-u06','p1-u07','p1-u08','p1-u09','p1-u10']
    };
    for(let n=1;n<=15;n++) {
      let ids=[];
      (EMERGENCY_P2_FOCUS[n]||[]).forEach(([unitId,start,end,max])=>ids.push(...distributeFromRange(p2,unitId,start,end,max)));
      let p1ids=[];
      (p1Sets[n]||[]).forEach(unitId=>{
        const unit=p1.filter(c=>c.unitId===unitId);
        const limit=n===12?2:(n>=10?2:Math.min(5,unit.length));
        p1ids.push(...unit.slice(0,limit).map(c=>c.id));
      });
      const tasks=[];
      if(n===2) tasks.push(newPlanTask('15',n,'Short research-methods PYQ set; log gaps','Paper 2','p2-u02','pyq',20));
      if(n===3) tasks.push(newPlanTask('15',n,'Testing PYQ set: reliability, validity and interpretation','Paper 2','p2-u03','pyq',20));
      if(n===8 || n===9) tasks.push(newPlanTask('15',n,'Core-area mixed PYQs and error repair','Paper 2','p2-u06','pyq',25));
      if(n===13) tasks.push(newPlanTask('15',n,'Mixed Psychology PYQs from the sources you enter; no fabricated question bank is included','Paper 2','','pyq',75));
      if(n===14) {
        tasks.push(newPlanTask('15',n,'Timed Paper 1 practice test; enter result in Mock Tests','Paper 1','','mock',60));
        tasks.push(newPlanTask('15',n,'Timed Paper 2 practice test; enter result in Mock Tests','Paper 2','','mock',120));
      }
      if(n===15) tasks.push(newPlanTask('15',n,'Final review: weak concepts, error log, formulas and exam logistics','Paper 2','','consolidation',45));
      if(n<=12) tasks.push(newPlanTask('15',n,'Compact Paper 1 selective review / practice','Paper 1',(p1Sets[n]||[])[0]||'','practice',20));
      days.push({day:n,title:planInfo[n-1],dateOverride:'',targetMinutes:210,targetCustomized:false,status:'planned',isRest:false,notes:'Emergency selective coverage only; do not interpret checked items as full-depth mastery.',conceptIds:[...ids,...p1ids],tasks});
    }
    return days;
  }

  function createInitialState() {
    const concepts=[...flattenUnits(PSY_UNITS,'Paper 2',PSY_SOURCE,true),...flattenUnits(PAPER1_UNITS,'Paper 1',PAPER1_SOURCE,false)];
    distributePaper1Days(concepts.filter(c=>c.paper==='Paper 1'));
    return {
      schemaVersion:2,
      createdAt:new Date().toISOString(),
      settings:{
        startDate:todayISO(), examDate:'', activePlan:'60', theme:'light',
        dailyTargetMinutes:210, paper1TargetMinutes:50, paper2TargetMinutes:160,
        revisionIntervals:[1,3,7,14], marksPerCorrect:2, negativeMarks:0,
        syllabusCheckedOn:'2026-10-10', showSupplementaryLabels:true
      },
      concepts,
      plans:{'60':build60DayPlan(concepts),'15':build15DayPlan(concepts)},
      revisions:[], sessions:[], timer:{status:'stopped',startedAt:null,elapsedMs:0,paper:'Paper 2',category:'new-learning',unitId:'',planId:'60',day:1},
      pyqs:[], mockTests:[], notes:[], unitNotes:{}, topicNotes:{}, planNotes:{}, dayDateOverrides:{},
      ui:{activePlan:'60'}
    };
  }

  const api={PAPER1_SOURCE,PSY_SOURCE,OFFICIAL_PAGE,PSY_UNITS,PAPER1_UNITS,P2_DAY_INFO,PAPER1_BLOCKS,createInitialState,slug,todayISO};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  root.StudyData=api;
})(typeof window!=='undefined'?window:globalThis);
