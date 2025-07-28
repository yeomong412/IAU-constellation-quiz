import pandas as pd
from io import StringIO

data = '''
Andromeda	And	안드로메다자리	0h 34m	39°15′	722	고대 (프톨레마이오스)		
Antlia	Ant	공기펌프자리	10h 7m	-33°21′	239	1763년, 라카유		
Apus	Aps	극락조자리	16h 8m	-76°35′	206	1603년, 우라노메트리아		
Aquarius	Aqr	물병자리	22h 42m	-10°28′	980	고대 (프톨레마이오스)		
Aquila	Aql	독수리자리	19h 41m	3°22′	652	고대 (프톨레마이오스)		
Ara	Ara	제단자리	17h 14m	-51°7′	237	고대 (프톨레마이오스)		
Aries	Ari	양자리	2h 41m	22°34′	441	고대 (프톨레마이오스)		
Auriga	Aur	마차부자리	5h 57m	42°49′	657	고대 (프톨레마이오스)		
Bootes	Boo	목동자리	14h 41m	32°20′	907	고대 (프톨레마이오스)		
Caelum	Cae	조각칼자리	4h 43m	-38°10′	125	1763년, 라카유		
Camelopardalis	Cam	기린자리	6h 9m	71°58′	757	1610년대 플란시우스		
Cancer	Cnc	게자리	8h 30m	23°34′	506	고대 (프톨레마이오스)		
Canes Venatici	CVn	사냥개자리	13h 1m	42°21′	465	1690년, 헤벨리우스		
Canis Major	CMa	큰개자리	6h 50m	-22°19′	380	고대 (프톨레마이오스)		
Canis Minor	CMi	작은개자리	7h 37m	6°46′	182	고대 (프톨레마이오스)		
Capricornus	Cap	염소자리	21h 3m	-19°21′	414	고대 (프톨레마이오스)		
Carina	Car	용골자리	7h 46m	-57°50′	494	1763년, 라카유	아르고자리에서 나뉨	
Cassiopeia	Cas	카시오페이아자리	0h 52m	60°18′	598	고대 (프톨레마이오스)		
Centaurus	Cen	센타우루스자리	12h 57m	-44°0′	1060	고대 (프톨레마이오스)		
Cepheus	Cep	세페우스자리	22h 25m	72°34′	588	고대 (프톨레마이오스)		
Cetus	Cet	고래자리	1h 43m	-6°22′	1231	고대 (프톨레마이오스)		
Chamaeleon	Cha	카멜레온자리	12h 0m	-81°1′	132	1603년, 우라노메트리아		
Circinus	Cir	컴퍼스자리	14h 32m	-67°18′	93	1763년, 라카유		
Columba	Col	비둘기자리	5h 42m	-37°55′	270	1592년 플란시우스	큰개자리에서 나뉨	
Coma Berenices	Com	머리털자리	12h 45m	22°39′	386	1603년, 우라노메트리아	사자자리에서 나뉨	
Corona Australis	CrA	남쪽왕관자리	18h 39m	-41°45′	128	고대 (프톨레마이오스)		
Corona Borealis	CrB	북쪽왕관자리	15h 53m	32°38′	179	고대 (프톨레마이오스)		
Corvus	Crv	까마귀자리	12h 23m	-18°38′	184	고대 (프톨레마이오스)		
Crater	Crt	컵자리	11h 21m	-38°45′	282	고대 (프톨레마이오스)		
Crux	Cru	남십자자리	12h 29m	-60°18′	68	1603년, 우라노메트리아	켄타우루스자리에서 나뉨	
Cygnus	Cyg	백조자리	20h 36m	49°35′	804	고대 (프톨레마이오스)		
Delphinus	Del	돌고래자리	20h 40m	12°6′	189	고대 (프톨레마이오스)		
Dorado	Dor	황새치자리	5h 20m	-63°1′	179	1603년, 우라노메트리아		
Draco	Dra	용자리	17h 57m	66°4′	1083	고대 (프톨레마이오스)		
Equuleus	Equ	조랑말자리	21h 15m	7°56′	72	고대 (프톨레마이오스)		
Eridanus	Eri	에리다누스자리	3h 53m	-17°59′	1138	고대 (프톨레마이오스)		
Fornax	For	화로자리	2h 46m	-26°4′	398	1763년, 라카유		
Gemini	Gem	쌍둥이자리	6h 51m	24°49′	514	고대 (프톨레마이오스)		
Grus	Gru	두루미자리	22h 27m	-45°49′	366	1603년, 우라노메트리아	남쪽물고기자리에서 나뉨	
Hercules	Her	헤르쿨레스자리	17h 26m	31°14′	1225	고대 (프톨레마이오스)		
Horologium	Hor	시계자리	3h 13m	-52°0′	249	1763년, 라카유		
Hydra	Hya	바다뱀자리	9h 8m	-11°41′	1303	고대 (프톨레마이오스)		
Hydrus	Hyi	물뱀자리	2h 35m	-72°55′	243	1603년, 우라노메트리아		
Indus	Ind	인디언자리	21h 8m	-52°19′	294	1603년, 우라노메트리아		
Lacerta	Lac	도마뱀자리	22h 31m	46°40′	201	1690년, 헤벨리우스		
Leo	Leo	사자자리	10h 0m	7°0′	947	고대 (프톨레마이오스)		
Leo Minor	LMi	작은사자자리	10h 19m	33°14′	232	1690년, 헤벨리우스		
Lepus	Lep	토끼자리	5h 26m	-19°39′	290	고대 (프톨레마이오스)		
Libra	Lib	천칭자리	15h 11m	-15°33′	538	고대 (프톨레마이오스)		
Lupus	Lup	이리자리	15h 23m	-42°43′	334	고대 (프톨레마이오스)		
Lynx	Lyn	살쾡이자리	7h 44m	47°50′	545	1690년, 헤벨리우스		
Lyra	Lyr	거문고자리	18h 54m	40°39′	286	고대 (프톨레마이오스)		
Mensa	Men	테이블산자리	5h 30m	-79°1′	153	1763년, 라카유		
Microscopium	Mic	현미경자리	20h 57m	-37°48′	210	1763년, 라카유		
Monoceros	Mon	외뿔소자리	6h 58m	-3°16′	482	1610년대 플란시우스		
Musca	Mus	파리자리	12h 28m	-69°8′	138	1603년, 우라노메트리아		
Norma	Nor	직각자자리	16h 3m	-52°43′	165	1763년, 라카유	수준기자리	
Octans	Oct	팔분의자리	22h 10m	-84°16′	291	1763년, 라카유		
Ophiuchus	Oph	뱀주인자리	17h 2m	-2°21′	948	고대 (프톨레마이오스)	땅꾼자리	
Orion	Ori	오리온자리	5h 34m	3°35′	594	고대 (프톨레마이오스)		
Pavo	Pav	공작자리	19h 10m	-65°52′	378	1603년, 우라노메트리아		
Pegasus	Peg	페가수스자리	22h 37m	19°39′	1121	고대 (프톨레마이오스)		
Perseus	Per	페르세우스자리	3h 31m	44°46′	615	고대 (프톨레마이오스)		
Phoenix	Phe	불사조자리	0h 44m	-48°46′	469	1603년, 우라노메트리아		
Pictor	Pic	화가자리	5h 23m	-51°22′	247	1763년, 라카유		
Pisces	Psc	물고기자리	0h 53m	15°29′	889	고대 (프톨레마이오스)		
Piscis Austrinus	PsA	남쪽물고기자리	22h 25m	-31°34′	245	고대 (프톨레마이오스)		
Puppis	Pup	고물자리	7h 52m	-32°37′	673	1763년, 라카유	아르고자리에서 나뉨	
Pyxis	Pyx	나침반자리	8h 53m	-29°47′	221	1763년, 라카유		
Reticulum	Ret	그물자리	3h 54m	-60°31′	114	1763년, 라카유		
Sagitta	Sge	화살자리	19h 40m	17°0′	80	고대 (프톨레마이오스)		
Sagittarius	Sgr	궁수자리	19h 23m	-29°53′	867	고대 (프톨레마이오스)		
Scorpius	Sco	전갈자리	16h 52m	-35°20′	497	고대 (프톨레마이오스)		
Sculptor	Scl	조각가자리	1h 0m	-38°31′	475	1763년, 라카유	조각실자리	
Scutum	Sct	방패자리	18h 39m	-10°53′	109	1690년, 헤벨리우스		
Serpens	Ser	뱀자리	15h 44m	10°51′	637	고대 (프톨레마이오스)		
Sextans	Sex	육분의자리	10h 6m	-1°8′	314	1690년, 헤벨리우스		
Taurus	Tau	황소자리	4h 6m	17°20′	797	고대 (프톨레마이오스)		
Telescopium	Tel	망원경자리	19h 15m	-51°28′	252	1763년, 라카유		
Triangulum	Tri	삼각형자리	2h 3m	32°20′	132	고대 (프톨레마이오스)		
Triangulum Australe	TrA	남쪽삼각형자리	16h 7m	-65°6′	110	1603년, 우라노메트리아		
Tucana	Tuc	큰부리새자리	23h 50m	-64°56′	295	1603년, 우라노메트리아		
Ursa Major	UMa	큰곰자리	10h 16m	57°29′	1280	고대 (프톨레마이오스)		
Ursa Minor	UMi	작은곰자리	14h 58m	75°2′	256	고대 (프톨레마이오스)		
Vela	Vel	돛자리	9h 20m	-48°29′	500	1763년, 라카유	아르고자리에서 나뉨	
Virgo	Vir	처녀자리	13h 21m	-3°31′	1294	고대 (프톨레마이오스)		
Volans	Vol	날치자리	7h 40m	-69°37′	141	1603년, 우라노메트리아		
Vulpecula	Vul	여우자리	20h 22m	25° 2′	278	1690년, 헤벨리우스		
'''

# StringIO로 텍스트를 파일처럼 읽을 수 있게 변환
df = pd.read_csv(StringIO(data), sep='\t')

# CSV 파일로 저장
df.to_csv('constellations.csv', index=False, encoding='utf-8-sig')
