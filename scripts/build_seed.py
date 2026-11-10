import json, hashlib, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
items=[]; cases=[]
CE='https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229'
L39='https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565'
L40='https://www.boe.es/buscar/act.php?id=BOE-A-2015-10566'
EBEP='https://www.boe.es/buscar/act.php?id=BOE-A-2015-11719'
EXCEL='https://support.microsoft.com/es-es/excel/sort-data-in-a-range-or-table-in-excel'
AVG='https://support.microsoft.com/es-es/excel/functions/average-function'
SUM='https://support.microsoft.com/es-es/excel/functions/sum-function'
SI='https://support.microsoft.com/es-es/excel/functions/if-function'
COUNT='https://support.microsoft.com/es-es/office/usar-la-funci%C3%B3n-contar-si-en-microsoft-excel-e0de10c6-f885-4e71-abb4-1f464816df34'
COUNTREF='https://support.microsoft.com/es-es/excel/statistical-functions-reference'
ACCESS='https://support.microsoft.com/es-es/access/add-or-change-a-table-s-primary-key-in-access'
ACCESSREL='https://support.microsoft.com/es-es/access/guide-to-table-relationships'
OUTLOOK='https://support.microsoft.com/es-es/outlook/training/set-up-rules-in-outlook'
WORD='https://support.microsoft.com/es-es/word/training/track-changes-in-word'
MERGE='https://support.microsoft.com/es-es/word/set-up-a-new-mail-merge-list-with-word'
MERGERULE='https://support.microsoft.com/es-es/word/set-the-rules-for-a-mail-merge'
WIN='https://support.microsoft.com/es-es/windows/apps/using-the-clipboard'

def q(sec,topic,stem,correct,wrong,src,article,exp=None,case=None):
    assert len(wrong)==3 and len({str(correct),*map(str,wrong)})==4,(stem,wrong)
    n=len(items)+1
    item={'id':f'AGE-C1-SEED-{n:04d}','block':sec,'topic':topic,'stem':stem,'options':[{'id':'o0','text':correct}]+[{'id':f'o{i}','text':w} for i,w in enumerate(wrong,1)],'correctOptionId':'o0','explanation':exp or f'Base normativa/documental: {article}. Revisa el texto íntegro y sus excepciones.','source':{'url':src,'locator':article},'review_status':'source_linked_pending_individual_audit','as_of':'2026-11-09'}
    if case:item['case_id']=case
    items.append(item)
    return item['id']

# Preguntas originales, no trascripción de cuestionarios INAP.
# El texto legal y la documentación técnica enlazados son el fundamento que debe auditarse pregunta por pregunta.
# CE: 25 preguntas de principios, instituciones y derechos.
ce=[
('I-01','¿Qué forma política del Estado establece el artículo 1.3 de la Constitución?','Monarquía parlamentaria',['República parlamentaria','Monarquía presidencialista','República federal'],'art. 1.3'),
('I-01','¿Dónde reside la soberanía nacional según la Constitución?','En el pueblo español',['En las Cortes Generales','En el Gobierno','En el Rey'],'art. 1.2'),
('I-01','¿Cuál de estos es un valor superior del ordenamiento jurídico según la Constitución?','Pluralismo político',['Neutralidad presupuestaria','Descentralización fiscal','Eficiencia administrativa'],'art. 1.1'),
('I-01','¿Cuál es la capital del Estado español según la Constitución?','La villa de Madrid',['La ciudad de Toledo','La ciudad de Barcelona','La ciudad de Sevilla'],'art. 5'),
('I-01','Según el artículo 3, ¿qué deber tienen todos los españoles respecto al castellano?','Conocerlo',['Utilizarlo en todos los actos privados','Acreditar su conocimiento cada cinco años','Usarlo siempre en relaciones laborales'],'art. 3.1'),
('I-01','¿Cuál es la edad de mayoría de edad en España según la Constitución?','18 años',['16 años','21 años','20 años'],'art. 12'),
('I-01','¿Qué principio prohíbe que los poderes públicos actúen de manera arbitraria?','Interdicción de la arbitrariedad',['Inviolabilidad administrativa','Jerarquía reglamentaria absoluta','Autonomía judicial'],'art. 9.3'),
('I-01','¿Qué protege expresamente el artículo 24 de la Constitución?','Tutela judicial efectiva',['Libertad de empresa','Derecho de huelga','Acceso a la vivienda'],'art. 24.1'),
('I-01','Según el artículo 23.2 de la Constitución, ¿qué se reconoce respecto a las funciones públicas?','Acceder en condiciones de igualdad, con los requisitos legales',['Acceder sin pruebas selectivas','Acceder solo por antigüedad','Acceder por designación directa obligatoria'],'art. 23.2'),
('I-01','¿Cómo deben ser la estructura y el funcionamiento interno de los partidos políticos?','Democráticos',['De designación hereditaria','Controlados por la Administración tributaria','Exclusivamente parlamentarios'],'art. 6'),
('I-01','¿Cómo deben ser la estructura y el funcionamiento interno de los sindicatos?','Democráticos',['Militares','Judiciales','Confesionales'],'art. 7'),
('I-03','¿Qué dos instituciones forman las Cortes Generales?','Congreso de los Diputados y Senado',['Congreso y Tribunal Constitucional','Senado y Consejo de Estado','Congreso y Consejo General del Poder Judicial'],'art. 66.1'),
('I-03','¿Qué cámara representa territorialmente, según la Constitución?','El Senado',['El Congreso de los Diputados','El Tribunal de Cuentas','El Tribunal Constitucional'],'art. 69.1'),
('I-03','Según la Constitución, ¿quién ejerce la potestad legislativa del Estado?','Las Cortes Generales',['El Consejo de Ministros exclusivamente','El Consejo de Estado','El Tribunal Supremo'],'art. 66.2'),
('I-02','¿Quién es el Jefe del Estado según el artículo 56?','El Rey',['El Presidente del Gobierno','El Presidente del Congreso','El Presidente del Senado'],'art. 56.1'),
('I-05','¿Quién dirige la política interior y exterior conforme al artículo 97?','El Gobierno',['El Tribunal Constitucional','Las Cortes en sesión conjunta','El Defensor del Pueblo'],'art. 97'),
('I-05','¿Quién propone un candidato a la Presidencia del Gobierno tras consultar a los representantes políticos?','El Rey, a través de la Presidencia del Congreso',['El Tribunal Supremo','El Senado por mayoría simple','La Junta Electoral Central'],'art. 99.1'),
('I-09','¿En qué se organiza territorialmente el Estado según el artículo 137?','Municipios, provincias y comunidades autónomas',['Solo provincias y comarcas','Municipios y ministerios','Distritos judiciales exclusivamente'],'art. 137'),
('I-10','¿Qué órgano gobierna y administra el municipio en los términos constitucionales?','El Ayuntamiento',['La Diputación provincial en todos los casos','La Delegación del Gobierno','El Consejo de Estado'],'art. 140'),
('I-01','¿Qué artículo constitucional contiene el principio general de igualdad ante la ley?','Artículo 14',['Artículo 47','Artículo 105','Artículo 128'],'art. 14'),
('I-04','¿De quién emana la justicia, según el artículo 117?','Del pueblo',['Del Gobierno','Del Rey exclusivamente','Del Consejo de Ministros'],'art. 117.1'),
('I-01','¿Qué derecho menciona expresamente el artículo 18.1?','Derecho al honor, a la intimidad personal y familiar y a la propia imagen',['Derecho a una vivienda pública','Derecho a vacaciones pagadas','Derecho a la educación universitaria gratuita'],'art. 18.1'),
('I-01','¿Qué principio garantiza la Constitución respecto a la publicación de normas?','Publicidad de las normas',['Secreto normativo','Vigencia retroactiva automática','Exclusividad de publicación en prensa privada'],'art. 9.3'),
('I-01','¿Qué modelo de Estado describe literalmente el artículo 1.1?','Estado social y democrático de Derecho',['Estado confederal','Estado presidencialista','Estado de partido único'],'art. 1.1'),
('I-01','¿Qué debe promover el poder público según el artículo 9.2?','Que libertad e igualdad sean reales y efectivas',['Que no exista pluralismo político','Que toda actividad privada tenga autorización previa','Que todas las competencias sean municipales'],'art. 9.2'),
]
for t,s,c,w,a in ce:q('theory',t,s,c,w,CE,a)

# Ley 39/2015: preguntas basadas en preceptos determinados.
law39=[
('III-03','¿Cuándo comienza el cómputo de un plazo señalado en días desde una notificación?','Al día siguiente de la notificación',['El mismo día de la notificación','Dos días después en todos los casos','Al inicio del mes siguiente'],'art. 30.3'),
('III-03','En el cómputo de días hábiles, ¿qué días se excluyen como regla general?','Sábados, domingos y festivos',['Solo los domingos','Solo los festivos nacionales','Únicamente los sábados'],'art. 30.2'),
('III-03','Si una norma señala expresamente días naturales, ¿cómo deben computarse?','Incluyendo sábados, domingos y festivos',['Excluyendo siempre sábados','Excluyendo domingos y festivos','Contando únicamente los días laborables de la oficina'],'art. 30.2'),
('III-03','Si el último día de un plazo es inhábil, ¿cuándo vence?','El primer día hábil siguiente',['Ese mismo día, sin cambios','El día hábil anterior siempre','Dos semanas después'],'art. 30.5'),
('III-03','Como regla general, los plazos administrativos expresados por horas son:','Hábiles',['Naturales sin excepciones','Siempre de 60 minutos exactos sin horario hábil','Únicamente horas de atención telefónica'],'art. 30.1'),
('III-03','¿Cuánto puede durar como máximo un plazo expresado por horas conforme al artículo 30?','24 horas',['48 horas','72 horas','7 días'],'art. 30.1'),
('III-03','Si la norma del procedimiento no fija plazo máximo de resolución, ¿cuál es el general?','Tres meses',['Un mes','Seis meses siempre','Doce meses'],'art. 21.3'),
('III-03','Como regla general, ¿qué plazo máximo de resolución puede fijar una norma reglamentaria?','No superior a seis meses, salvo norma con rango de ley o Derecho de la UE',['Sin límite máximo','Un máximo absoluto de quince días','Siempre treinta días'],'art. 21.2'),
('III-03','En los procedimientos iniciados a solicitud del interesado, ¿qué regla general rige el silencio?','Estimatorio, salvo excepciones legales',['Siempre desestimatorio','Siempre nulo','Siempre suspensivo'],'art. 24.1'),
('III-03','La obligación administrativa de dictar resolución expresa existe:','En todos los procedimientos, salvo las excepciones previstas',['Solo cuando haya recurso','Solo en procedimientos sancionadores','Solo si se exige por escrito una segunda vez'],'art. 21.1'),
('III-03','¿Cuál es, como regla general, el plazo de subsanación de una solicitud incompleta?','Diez días',['Tres días','Veinte días hábiles','Un mes'],'art. 68.1'),
('III-03','En la Ley 39/2015, ¿qué recurso se presenta normalmente ante el superior jerárquico del órgano que dictó el acto?','Recurso de alzada',['Recurso de reposición','Recurso extraordinario de revisión ante un juzgado','Demanda laboral'],'arts. 121 y 122'),
('III-03','¿Qué recurso administrativo es potestativo y se presenta ante el mismo órgano que dictó el acto?','Recurso de reposición',['Recurso de alzada','Recurso de casación','Recurso de suplicación'],'arts. 123 y 124'),
('III-03','¿Cuál es el plazo para interponer alzada contra un acto expreso?','Un mes',['Diez días naturales','Tres meses','Un año'],'art. 122.1'),
('III-03','¿Qué plazo máximo tiene la Administración para resolver y notificar un recurso de alzada?','Tres meses',['Un mes','Seis días','Seis meses como regla general'],'art. 122.2'),
('III-03','¿Cuál es el plazo para interponer reposición potestativa contra un acto expreso?','Un mes',['Diez días','Tres meses','Un año'],'art. 124.1'),
('III-03','¿Qué plazo máximo hay para resolver y notificar un recurso potestativo de reposición?','Un mes',['Tres meses','Seis meses','Un año'],'art. 124.2'),
('III-03','¿Qué sujetos deben, en todo caso, relacionarse electrónicamente para trámites administrativos según el art. 14?','Personas jurídicas',['Todas las personas físicas sin excepción','Todos los mayores de 16 años','Todos los titulares de un permiso de conducir'],'art. 14.2.a'),
('III-03','Un particular que no está obligado al canal electrónico, ¿puede elegirlo?','Sí, puede elegir y modificar el medio de comunicación, salvo obligaciones aplicables',['No, el canal electrónico queda prohibido','Solo con autorización judicial','Solo mediante representante profesional'],'art. 14.1'),
('III-03','¿Dónde pueden presentarse documentos dirigidos a Administraciones públicas?','En registros electrónicos y demás lugares previstos legalmente',['Solo en la oficina emisora','Únicamente en notaría','En cualquier red social oficial'],'art. 16.4'),
('III-02','Como regla general, ¿en qué plazo debe cursarse una notificación desde que se dicta el acto?','Dentro de los diez días',['Dentro de los treinta días','Al día siguiente siempre','En un máximo de tres meses'],'art. 40.2'),
('III-02','Una notificación debe contener, entre otros elementos:','Texto íntegro, indicación de recursos y plazos en los términos legales',['Solo un número de expediente','Solo el sello de salida','Exclusivamente el nombre del funcionario'],'art. 40.2'),
('III-02','La notificación electrónica por comparecencia, cuando es obligatoria, se entiende rechazada por falta de acceso tras:','Diez días naturales desde su puesta a disposición',['Diez días hábiles','Veinte días naturales','Un mes completo'],'art. 43.2'),
('III-03','¿Qué puede hacer un interesado en el procedimiento, antes del trámite de audiencia?','Formular alegaciones y aportar documentos en los términos legales',['Exigir un juicio oral','Modificar el BOE','Suspender unilateralmente cualquier plazo'],'art. 76.1'),
('III-03','¿Cuál es el plazo del trámite de audiencia, con carácter general?','No inferior a diez ni superior a quince días',['Siempre tres días','Siempre un mes','Entre veinte y treinta días'],'art. 82.2'),
('III-03','¿Cuál es el plazo ordinario de prueba si la Administración abre un período de prueba?','Entre diez y treinta días',['Entre uno y tres días','Siempre cuarenta días','Siempre sesenta días'],'art. 77.2'),
('III-03','¿En qué supuesto puede ampliarse excepcionalmente el plazo de subsanación previsto en el art. 68?','Cuando la aportación de documentos requeridos presente dificultades especiales y proceda legalmente',['Siempre sin motivación','Cuando lo pida cualquier tercero','Nunca en ningún caso'],'art. 68.2'),
('III-03','La tramitación de urgencia, como regla, reduce a la mitad los plazos salvo los de:','Presentación de solicitudes y recursos',['Práctica de informes y alegaciones','Actos de trámite','Publicación de anuncios'],'art. 33.1'),
('III-03','¿Qué documento permite iniciar una actividad bajo responsabilidad de cumplir los requisitos, en los términos legales?','Declaración responsable',['Resolución sancionadora','Certificación de silencio','Acta de inspección judicial'],'art. 69.1'),
('III-03','¿Qué formas de terminación del procedimiento reconoce la Ley 39/2015?','Resolución, desistimiento, renuncia y caducidad, entre otras previstas',['Solo sanción y archivo judicial','Únicamente una sentencia','Solo contrato y convenio'],'art. 84'),
('III-03','¿Qué recurso puede presentarse contra resoluciones y actos que no ponen fin a la vía administrativa en los casos del artículo 112?','Alzada',['Solo recurso extraordinario de revisión','Solo casación','Ningún recurso en ningún caso'],'arts. 112 y 121'),
('III-03','En una solicitud de iniciación, ¿qué identificación se exige entre otros datos?','Nombre y apellidos del interesado o denominación de la persona jurídica, en su caso',['Siempre el DNI de todos los convivientes','Número de cuenta corriente obligatoriamente','Nombre del juez competente'],'art. 66.1'),
('III-03','Las actuaciones administrativas se practicarán normalmente de oficio mediante:','Medios electrónicos y conforme a los principios de celeridad y transparencia',['Solo por teléfono','Solo a petición del Ministerio Fiscal','Exclusivamente mediante actas notariales'],'art. 75'),
('III-03','¿Qué efecto tienen los actos administrativos sujetos al Derecho Administrativo, como regla general?','Se presumen válidos y producen efectos desde la fecha en que se dictan, salvo disposición distinta',['Son nulos hasta control judicial','Solo producen efectos al mes siguiente','Carecen siempre de fuerza ejecutiva'],'art. 39.1'),
('III-03','¿En qué consiste la revisión de oficio de actos nulos en los términos de la Ley 39/2015?','Declaración de nulidad en supuestos tasados y con los requisitos legales',['Revocación verbal sin procedimiento','Anulación obligatoria de todos los actos antiguos','Derogación de una ley por el órgano instructor'],'art. 106'),
('III-03','¿Qué sucede cuando el interesado desiste de su solicitud?','La Administración acepta el desistimiento y declara concluso el procedimiento, con las salvedades legales',['Se impone siempre una multa','Se dicta una condena penal','Se transforma automáticamente en recurso de alzada'],'art. 94'),
('III-03','¿Qué son las copias auténticas de documentos administrativos?','Copias con validez y eficacia legal conforme al art. 27',['Simples fotografías sin garantías','Documentos con valor solo interno','Copias válidas únicamente en una oficina'],'art. 27'),
('III-03','¿Qué tratamiento recibe una solicitud presentada electrónicamente por un sujeto obligado a hacerlo que la hubiera presentado presencialmente?','Se le requiere subsanación mediante presentación electrónica; fecha válida es la subsanación',['Se da por cumplida en la fecha de registro presencial','Se traslada automáticamente al juzgado','Se destruye sin aviso'],'art. 68.4'),
('III-03','¿Qué puede hacer la Administración frente a defectos subsanables de actos anulables, con los requisitos legales?','Convalidarlos',['Declararlos inexistentes sin resolución','Convertirlos en leyes orgánicas','Modificar la Constitución'],'art. 52'),
('III-03','Los plazos expresados por meses o años, como regla general, se computan:','Desde el día siguiente y concluyen el mismo día ordinal equivalente del vencimiento',['Siempre por 30 días naturales exactos','Excluyendo todos los fines de semana intermedios','Desde el día anterior a la notificación'],'art. 30.4'),
]
for t,s,c,w,a in law39:q('theory',t,s,c,w,L39,a)
# Ley 40/2015, TREBEP: condiciones institucionales y empleo público.
others=[
('III-03','¿Qué ley regula principalmente el régimen jurídico del sector público estatal, autonómico y local?','Ley 40/2015',['Ley 30/1992 en su totalidad vigente','Ley 2/1985 de protección civil','Real Decreto 1/1995'],'Ley 40/2015, arts. 1 y 2',L40),
('I-08','¿Cuál de estos principios debe respetar la Administración al imponer medidas limitativas de derechos?','Proporcionalidad',['Arbitrariedad','Confidencialidad absoluta de toda actuación','Inmunidad de control judicial'],'Ley 40/2015, art. 4',L40),
('III-03','¿Qué principio de actuación administrativa recoge expresamente el art. 3 de la Ley 40/2015?','Servicio efectivo a los ciudadanos',['Libre fijación de tasas por cada funcionario','Preferencia de proveedores privados por regla','Revocación sin motivar de todo acto'],'Ley 40/2015, art. 3',L40),
('III-03','¿Cómo actúa cada Administración Pública para cumplir sus fines según la Ley 40/2015?','Con personalidad jurídica única',['Con tantas personalidades como empleados','Sin personalidad jurídica alguna','Solo mediante personas físicas'],'Ley 40/2015, art. 3.4',L40),
('IV-01','¿Qué grupo de personal contempla el TREBEP entre los empleados públicos?','Personal funcionario de carrera',['Solo personal autónomo','Solo becarios privados','Solo cargos electivos'],'TREBEP, art. 8',EBEP),
('IV-01','¿Qué tipo de empleado público presta servicios mediante contrato laboral?','Personal laboral',['Funcionario de carrera','Funcionario interino necesariamente','Personal eventual necesariamente'],'TREBEP, arts. 8 y 11',EBEP),
('IV-03','¿Qué relación vincula al funcionario de carrera con la Administración?','Relación estatutaria regulada por Derecho Administrativo',['Contrato mercantil','Contrato laboral indefinido siempre','Arrendamiento de servicios profesional'],'TREBEP, art. 9',EBEP),
('IV-03','¿Cómo se vincula el personal funcionario interino, según el TREBEP?','Por razones expresamente justificadas de necesidad y urgencia',['Para ocupar libremente cargos judiciales','Como sustituto automático de toda externalización','Por elección ciudadana'],'TREBEP, art. 10',EBEP),
('IV-02','¿Qué principios deben regir el acceso al empleo público?','Igualdad, mérito y capacidad',['Antigüedad privada exclusivamente','Concurso sin publicidad','Designación hereditaria'],'TREBEP, art. 55',EBEP),
('IV-05','¿Qué modalidad de carrera implica ascenso de subgrupo mediante procedimientos selectivos?','Promoción interna vertical',['Reasignación temporal de tareas','Teletrabajo','Concurso de proveedores'],'TREBEP, art. 18',EBEP),
('IV-02','¿Qué subgrupo incluye los puestos para cuyo acceso se exige Bachiller o Técnico?','C1',['A1','A2','Agrupaciones Profesionales sin titulación'],'TREBEP, art. 76',EBEP),
('IV-02','¿Qué titulación es la exigencia general de acceso al subgrupo A2?','Título universitario de Grado, salvo previsión específica legal',['Graduado en ESO exclusivamente','Certificado de profesionalidad nivel 1','Técnico de grado medio exclusivamente'],'TREBEP, art. 76',EBEP),
('IV-05','¿Cuál es el período mínimo de servicios activos para promoción interna de funcionario, como regla general?','Dos años en el subgrupo inferior',['Seis meses','Diez años','No hay antigüedad exigida nunca'],'TREBEP, art. 18.2',EBEP),
('IV-04','¿Qué adquisición es necesaria, entre otros requisitos, para obtener la condición de funcionario de carrera?','Nombramiento por órgano competente publicado oficialmente',['Acuerdo verbal de un superior','Inscripción voluntaria en sindicato','Firma de contrato mercantil'],'TREBEP, art. 62',EBEP),
('IV-05','¿Qué es un trienio en la retribución básica de los funcionarios?','Un complemento asociado a cada tres años de servicio reconocido',['Un aumento automático cada trimestre','Una productividad por objetivos','Una gratificación por concurso de traslado'],'TREBEP, art. 23',EBEP),
('IV-05','¿Qué tipos de retribuciones establece el TREBEP para funcionarios de carrera?','Básicas y complementarias',['Solo variables y extraordinarias','Solo indemnizatorias','Solo productividad mensual'],'TREBEP, art. 22.2',EBEP),
('IV-05','¿Qué forma habitual de provisión de puestos se contempla en el TREBEP?','Concurso de méritos',['Sorteo obligatorio anual','Subasta pública de plazas','Designación por antigüedad sin expediente en todos los casos'],'TREBEP, art. 78',EBEP),
('IV-05','¿Cuántos días hábiles de vacaciones retribuidas anuales fija el TREBEP como regla general?','22 días hábiles',['10 días naturales','30 días hábiles en todo caso','14 días naturales'],'TREBEP, art. 50',EBEP),
('IV-02','¿Qué sistema selectivo es uno de los previstos para personal funcionario de carrera?','Oposición',['Nombramiento por sorteo','Concurso mercantil','Subcontratación directa'],'TREBEP, art. 61',EBEP),
]
for t,s,c,w,a,src in others:q('theory',t,s,c,w,src,a)

# Office questions: facts backed by Microsoft Support sources and versioned to MS365/Win11.
its=[
('VI-05','¿Qué función de Excel suma los valores de un rango?','SUMA',['PROMEDIO','CONTAR.SI','MAX.SI'],SUM,'función SUMA'),
('VI-05','¿Qué función de Excel obtiene la media aritmética de un rango?','PROMEDIO',['CONTARA','SUMA','BUSCARV'],AVG,'función PROMEDIO'),
('VI-05','¿Qué función de Excel cuenta las celdas que cumplen un criterio?','CONTAR.SI',['PROMEDIO','SUMA','HOY'],COUNT,'función CONTAR.SI'),
('VI-05','¿Qué función permite elegir entre dos resultados según una prueba lógica?','SI',['SUMA','DESREF','REDONDEAR'],SI,'función SI'),
('VI-05','¿Qué resultado devuelve =SUMA(A1:A3) si A1=2, A2=4 y A3=6?','12',['8','6','24'],SUM,'función SUMA'),
('VI-05','¿Qué resultado devuelve =PROMEDIO(A1:A3) si A1=2, A2=4 y A3=6?','4',['12','6','3'],AVG,'función PROMEDIO'),
('VI-05','¿Qué devuelve =SI(A1>10;"Alto";"Bajo") cuando A1 vale 15?','Alto',['Bajo','VERDADERO','15'],SI,'función SI'),
('VI-05','¿Qué devuelve =SI(A1>10;"Alto";"Bajo") cuando A1 vale 8?','Bajo',['Alto','FALSO','8'],SI,'función SI'),
('VI-05','¿Qué resultado devuelve CONTAR.SI para el rango [Madrid, Madrid, Toledo] con criterio Madrid?','2',['1','3','0'],COUNT,'función CONTAR.SI'),
('VI-05','Para ordenar una columna de texto alfabéticamente de A a Z, ¿qué opción se utiliza?','Ordenar de A a Z',['Ordenar de Z a A','Eliminar duplicados','Formato condicional'],EXCEL,'ordenación ascendente'),
('VI-05','Para ordenar números de mayor a menor, ¿qué orden debe seleccionarse?','Descendente',['Ascendente','Cronológico ascendente','Alfabético ascendente'],EXCEL,'ordenación numérica'),
('VI-05','¿Qué permite la ordenación personalizada de Excel?','Ordenar por varias columnas y niveles',['Eliminar permanentemente todas las fórmulas','Convertir automáticamente el libro en Access','Cambiar el sistema operativo'],EXCEL,'ordenar por varias columnas'),
('VI-05','¿Qué herramienta de Excel permite mostrar solo filas que cumplen criterios?','Filtro',['Combinar correspondencia','Revisión de cambios de Word','Clave principal de Access'],EXCEL,'filtro automático'),
('VI-05','En Excel, ¿qué función cuenta celdas con valores no vacíos?','CONTARA',['CONTAR.BLANCO','SUMA','MEDIANA'],COUNTREF,'funciones estadísticas'),
('VI-05','¿Qué función de Excel cuenta celdas vacías de un rango?','CONTAR.BLANCO',['CONTARA','CONTAR.SI.CONJUNTO','SUMA'],COUNTREF,'funciones estadísticas'),
('VI-05','¿Qué función cuenta celdas que cumplen varios criterios?','CONTAR.SI.CONJUNTO',['CONTAR.BLANCO','SI.ERROR','ALEATORIO'],COUNTREF,'funciones estadísticas'),
('VI-06','¿Cuál es la finalidad principal de una clave principal en Access?','Identificar de modo único cada registro de una tabla',['Cambiar el color del informe','Generar automáticamente un gráfico','Enviar correos a proveedores'],ACCESS,'clave principal'),
('VI-06','¿Puede una clave principal de Access estar formada por varios campos?','Sí, puede ser compuesta',['No, siempre debe ser una sola columna','Solo en archivos Excel','Solo cuando no existen relaciones'],ACCESS,'clave principal compuesta'),
('VI-06','¿Qué característica debe tener el valor de una clave principal?','No debe ser nulo',['Siempre debe ser texto','Debe repetirse en registros distintos','No puede indexarse'],ACCESS,'validez de clave principal'),
('VI-06','¿Cuántas claves principales puede tener una tabla de Access?','Una clave principal, aunque formada por varios campos',['Cuatro claves principales obligatorias','Tantas como registros','Ninguna en todas las tablas'],ACCESS,'tabla y clave principal'),
('VI-06','¿Cuál es el tipo de campo que Access suele generar como identificador automático al crear una tabla en vista hoja de datos?','Autonumeración',['Hipervínculo obligatorio','Objeto OLE','Adjunto binario'],ACCESS,'id autonumeración'),
('VI-06','En una relación de tablas, ¿qué campo suele apuntar a la clave principal de otra tabla?','Clave externa',['Encabezado de informe','Campo de formato condicional','Control de impresión'],ACCESSREL,'relaciones de tablas'),
('VI-06','¿Qué opción de Access permite crear o modificar vínculos entre tablas?','Herramientas de base de datos > Relaciones',['Inicio de sesión Windows > Usuarios','Revisar > Control de cambios','Correspondencia > Destinatarios'],ACCESSREL,'ventana Relaciones'),
('VI-06','¿Para qué sirve la integridad referencial entre tablas relacionadas?','Ayuda a impedir referencias huérfanas a registros inexistentes',['Elimina la necesidad de claves primarias','Convierte automáticamente tablas en PDFs','Impide toda consulta de datos'],ACCESSREL,'integridad referencial'),
('VI-07','¿Qué permiten hacer las reglas de Outlook?','Mover o marcar mensajes automáticamente según condiciones',['Modificar el registro de Windows','Crear relaciones entre tablas Access','Resolver fórmulas de Excel'],OUTLOOK,'reglas de Outlook'),
('VI-07','¿Qué condición puede usarse en una regla de Outlook para mover mensajes a una carpeta?','Que el asunto contenga un texto determinado',['Que el PC tenga dos monitores','Que el documento Word tenga portada','Que la base de datos tenga clave compuesta'],OUTLOOK,'regla según asunto'),
('VI-07','¿Se puede crear una regla de Outlook a partir de un mensaje existente?','Sí, desde el menú contextual del mensaje',['No, únicamente desde Excel','Solo con permisos de administrador de Windows','Solo mediante PowerShell'],OUTLOOK,'crear regla desde un mensaje'),
('VI-07','¿Qué acción es característica de las reglas de Outlook?','Marcar mensajes para seguimiento',['Ordenar automáticamente celdas Access','Cambiar el idioma de Windows','Bloquear una cuenta bancaria'],OUTLOOK,'acciones de reglas'),
('VI-04','En Word, ¿qué función resalta inserciones y eliminaciones para su revisión?','Control de cambios',['Administrador de tareas','Validación de datos','Clave principal'],WORD,'control de cambios'),
('VI-04','¿En qué pestaña de Word se gestiona el Control de cambios?','Revisar',['Datos','Diseño de tabla Access','Vista previa de Outlook'],WORD,'pestaña Revisar'),
('VI-04','¿Qué permite hacer al revisar una modificación con Control de cambios?','Aceptarla o rechazarla',['Convertirla en un registro de Access','Asignarle clave externa','Enviar automáticamente un correo al tribunal'],WORD,'aceptar o rechazar cambios'),
('VI-04','¿Qué función de Word permite generar cartas personalizadas para varios destinatarios?','Combinar correspondencia',['Filtrado avanzado de Excel','Clave principal','Control de cuentas de usuario'],MERGE,'combinar correspondencia'),
('VI-04','¿En qué pestaña se configuran los destinatarios de combinar correspondencia en Word?','Correspondencia',['Fórmulas','Herramientas de tabla Access','Inicio de Windows'],MERGE,'seleccionar destinatarios'),
('VI-04','¿Qué regla de combinación de correspondencia permite elegir texto según una condición?','Si... Entonces... En caso contrario',['Eliminar archivos temporales','Permisos NTFS','Proteger hoja Excel'],MERGERULE,'regla condicional de combinación'),
('VI-02','¿Con qué combinación de teclas se abre el historial del portapapeles en Windows 11?','Windows + V',['Ctrl + D','Windows + R + E','Alt + F8'],WIN,'historial del portapapeles'),
('VI-02','¿Qué ocurre con elementos del historial del portapapeles al reiniciar Windows, salvo los anclados?','Se borran',['Se imprimen automáticamente','Se envían siempre a Outlook','Se convierten en accesos directos'],WIN,'historial del portapapeles'),
('VI-02','Según Microsoft, ¿cuál es el límite de entradas en el historial del portapapeles?','25 entradas',['5 entradas','1000 entradas','Sin límite'],WIN,'límite de entradas del historial'),
('VI-02','¿Qué permite hacer el historial del portapapeles además de pegar el último elemento?','Pegar elementos anteriores',['Ejecutar macro de Access de forma automática','Convertir correo en reunión','Cambiar contraseñas de cuentas'],WIN,'historial portapapeles'),
('VI-05','Al ordenar por varias columnas en Excel, ¿qué se usa para introducir un criterio adicional?','Agregar nivel',['Crear un correo nuevo','Cambiar clave principal','Eliminar libro'],EXCEL,'ordenación por niveles'),
('VI-05','Si se ordena por texto de Z a A en Excel, ¿qué orden se utiliza?','Descendente',['Ascendente','Orden aleatorio obligatorio','Orden sin criterio'],EXCEL,'ordenación descendente'),
]
for t,s,c,w,src,a in its:q('office',t,s,c,w,src,a)

# Casos prácticos: hechos de ejemplo inventados y declarados como ficticios; las reglas exigidas están en los arts. citados.
# Se evita afirmar que son supuestos publicados por INAP.
case_defs=[
 {'id':'CASE-A','title':'Registro, subsanación, notificaciones y recursos','factual_setup':'Una unidad administrativa recibe solicitudes y tramita un procedimiento común. Las fechas y personas son ficticias; se aplican las reglas generales de la Ley 39/2015 salvo excepciones expresas.'},
 {'id':'CASE-B','title':'Tramitación de un expediente y resolución','factual_setup':'Una oficina estatal instruye expedientes administrativos ordinarios. Los nombres y hechos son ficticios. Se pregunta por las normas generales de la Ley 39/2015, sin regímenes sectoriales especiales.'},
]
# Para cada caso redactar preguntas referidas a la situación y reglas generales. 20 por caso, ligadas a ley vigente.
a=[
('Una persona física no obligada a usar medios electrónicos quiere presentar su solicitud por Internet. ¿Es posible?','Sí, puede elegir el medio electrónico',['No, queda reservado a empresas','Solo si ya es funcionaria','Solo mediante abogado'],'art. 14.1'),
('Una sociedad mercantil presenta una solicitud. ¿Debe relacionarse electrónicamente?','Sí, como persona jurídica',['No, nunca','Solo a partir de 50 trabajadores','Solo para recursos'],'art. 14.2.a'),
('La oficina recibe una solicitud incompleta. ¿Qué plazo general debe dar para subsanarla?','10 días',['3 días','20 días','30 días'],'art. 68.1'),
('Una entidad obligada a presentar documentos electrónicamente los entrega en papel. ¿Qué debe hacer la Administración?','Requerir la subsanación mediante presentación electrónica',['Aceptarlos como presentación válida sin más','Destruirlos','Sancionar directamente sin subsanación'],'art. 68.4'),
('Una notificación se produce un lunes. Si el plazo es de días hábiles, ¿desde cuándo comienza?','Desde el día siguiente',['Desde la hora de salida del funcionario','Desde el lunes de la semana siguiente','Desde el último día del mes'],'art. 30.3'),
('Si el último día del plazo es sábado y no hay regla especial, ¿qué ocurre?','El vencimiento pasa al primer día hábil siguiente',['Vence el sábado','Vence el viernes anterior','El procedimiento caduca automáticamente'],'art. 30.5'),
('Al calcular 5 días hábiles, ¿qué se excluye en todo caso según la regla general?','Sábados, domingos y festivos',['Únicamente domingos','Los lunes','Los viernes'],'art. 30.2'),
('La norma no fija plazo máximo de resolución. ¿Cuál se aplica por defecto?','3 meses',['10 días','6 meses obligatoriamente','Un año'],'art. 21.3'),
('La Administración debe resolver expresamente un procedimiento. ¿Cuál es la regla?','Existe obligación de dictar resolución expresa, con salvedades legales',['Solo si el solicitante paga una tasa','Solo cuando haya reclamación judicial','Solo si la solicitud se presentó en papel'],'art. 21.1'),
('Llega el vencimiento de una solicitud sin resolución. ¿Qué regla general se aplica al silencio?','Estimatorio salvo excepciones previstas',['Siempre desestimatorio','Inexistente','Se abre automáticamente un proceso penal'],'art. 24.1'),
('El órgano dicta un acto administrativo. ¿Qué eficacia general tienen los actos?','Se presumen válidos y producen efectos desde que se dictan, salvo previsión distinta',['Nunca producen efectos sin sentencia','Solo son eficaces al año','No vinculan a nadie'],'art. 39.1'),
('Se dicta un acto que debe notificarse al interesado. ¿En qué plazo general debe cursarse la notificación?','10 días desde el acto',['2 meses','30 días naturales','1 año'],'art. 40.2'),
('Se pone una notificación electrónica obligatoria a disposición y nadie accede. ¿Cuándo se entiende rechazada en general?','Tras 10 días naturales',['Tras 10 días hábiles','Tras 24 horas','Tras 30 días hábiles'],'art. 43.2'),
('La notificación debe informar al ciudadano sobre recursos. ¿Qué ha de constar en la comunicación?','Recursos procedentes, órgano y plazo, según la ley',['Solo nombre del empleado','Solo dirección web de inicio','Solo la fecha de firma'],'art. 40.2'),
('El interesado quiere aportar documentos antes de audiencia. ¿Puede hacerlo?','Sí, en los términos legales',['No, solo durante el juicio','Solo después de resolución','Nunca puede presentar documentos complementarios'],'art. 76.1'),
('Se abre un trámite de audiencia general. ¿Qué horquilla de plazo procede?','Entre 10 y 15 días',['Entre 1 y 2 días','Entre 30 y 60 días','Siempre 7 meses'],'art. 82.2'),
('Se recurre un acto expreso que no pone fin a vía administrativa mediante alzada. ¿Plazo de interposición?','1 mes',['1 semana','3 meses','2 años'],'art. 122.1'),
('Se presenta recurso de alzada. ¿Plazo máximo ordinario de resolución?','3 meses',['1 mes','6 meses','1 año'],'art. 122.2'),
('Se interpone reposición potestativa contra un acto expreso. ¿Ante qué órgano?','El mismo que dictó el acto',['Siempre el Tribunal Constitucional','La fiscalía provincial','El Senado'],'art. 123.1'),
('Se interpone reposición potestativa. ¿Cuál es su plazo máximo de resolución?','1 mes',['3 meses','6 meses','2 años'],'art. 124.2'),
]
b=[
('En un expediente se contempla la tramitación de urgencia. ¿Cómo se reducen los plazos en general?','A la mitad, salvo excepciones',['Se triplican','No cambia ninguno','Se multiplican por diez'],'art. 33.1'),
('La tramitación de urgencia afecta a los plazos de presentación de solicitudes y recursos. ¿Cuál es la regla?','Esos plazos no se reducen a la mitad por urgencia',['Siempre se reducen a la cuarta parte','Se suprimen','Solo se amplían'],'art. 33.1'),
('La unidad necesita aclarar hechos y acuerda período de prueba. ¿Duración ordinaria?','De 10 a 30 días',['De 1 a 2 días','De 60 a 90 días','Siempre 6 meses'],'art. 77.2'),
('La interesada presenta alegaciones antes de audiencia. ¿Cómo debe actuar el órgano?','Admitirlas para su consideración en los términos de la ley',['Rechazarlas por extemporáneas siempre','Destruirlas','Tramitarlas solo como recurso judicial'],'art. 76.1'),
('Se prepara un trámite de audiencia. ¿Plazo mínimo normal que debe darse?','10 días',['1 día','3 días','30 días'],'art. 82.2'),
('La oficina recibe solicitud sin datos requeridos. ¿Qué actuación corresponde primero?','Requerir subsanación en términos del artículo 68',['Archivar de inmediato sin requerimiento','Imponer multa penal','Dictar sentencia'],'art. 68.1'),
('Se pretende resolver un asunto sin plazo fijado en norma específica. ¿Plazo general?','3 meses',['15 días','2 años','1 semana'],'art. 21.3'),
('El órgano instruye un procedimiento administrativo. ¿Qué principio orienta el impulso de los actos de instrucción?','Impulso de oficio y celeridad, conforme a la ley',['Solo impulso a petición del afectado','Inactividad permanente','Reserva absoluta sin expediente'],'art. 75'),
('Se dicta resolución del expediente. ¿Debe pronunciarse sobre las cuestiones planteadas?','Sí, con el alcance que establece la Ley 39/2015',['No, puede omitir el objeto','Solo sobre las cuestiones de gasto','Únicamente sobre el registro de entrada'],'art. 88.1'),
('La oficina notifica una resolución. ¿Qué ha de contener la notificación?','Texto íntegro e información sobre recursos pertinentes',['Únicamente el identificador del programa','Solo la inicial del interesado','Una captura del escritorio'],'art. 40.2'),
('El destinatario tiene obligación electrónica. ¿Cuándo se entiende rechazada una notificación puesta a disposición sin acceso?','A los 10 días naturales, en los términos legales',['A los 10 días hábiles','A las 2 horas','A los 3 meses'],'art. 43.2'),
('El procedimiento se inicia a solicitud. Como regla general, el silencio sin resolución es:','Estimatorio, con las excepciones legales',['Siempre penal','Siempre nulo','Siempre desestimatorio sin excepciones'],'art. 24.1'),
('Se presenta un recurso de alzada contra acto expreso. ¿Plazo?','1 mes',['10 días naturales','6 meses','No hay plazo'],'art. 122.1'),
('¿A qué órgano se dirige la resolución de un recurso de alzada?','Al superior jerárquico competente según la ley',['Siempre a la Mesa del Congreso','Al tribunal de cuentas','A una notaría pública'],'art. 121'),
('Un acto pone fin a la vía administrativa. ¿Qué recurso administrativo potestativo puede interponerse ante el mismo órgano?','Reposición',['Alzada obligatoria','Suplicación laboral','Casación constitucional'],'art. 123.1'),
('Si se interpone reposición potestativa contra acto expreso, ¿en qué plazo?','1 mes',['12 meses','72 horas','5 años'],'art. 124.1'),
('Un interesado comunica desistimiento de su solicitud. ¿Qué sucede por regla general?','La Administración lo acepta y declara concluso el procedimiento, con salvedades legales',['Procede siempre multa de 300 €','Se presenta un recurso automáticamente','El acto se convierte en reglamento'],'art. 94'),
('El órgano precisa una copia auténtica de un documento. ¿Qué regula la Ley 39/2015?','La validez y efectos de las copias auténticas',['El precio de compraventa de bienes','Los horarios de comercio','La creación de partidos políticos'],'art. 27'),
('La oficina se plantea convalidar un acto anulable. ¿En qué artículo se apoya?','Artículo 52',['Artículo 1 de la Constitución','Artículo 88 del TREBEP','Artículo 138 de la Ley de contratos'],'art. 52'),
('Un procedimiento admite declaración responsable. ¿Qué asume quien la presenta?','Que cumple los requisitos exigidos, dispone de documentación y mantendrá su cumplimiento, en los términos legales',['Que queda exento de toda inspección','Que la Administración renuncia a controlar','Que no necesita requisitos de ningún tipo'],'art. 69.1'),
]
for cs,rows in [('CASE-A',a),('CASE-B',b)]:
    assert len(rows)==20
    ids=[]
    for s,c,w,art in rows:
        ids.append(q('practical','III-03',f'[{cs}] {s}',c,w,L39,art,case=cs))
    cases.append({**next(c for c in case_defs if c['id']==cs),'question_ids':ids,'source':L39})

# Tema oficial 2025: títulos resumidos; numeración exacta y recuento por bloque.
syllabus={
'I':['Constitución, derechos y reforma','Corona: sucesión y regencia','Cortes Generales','Poder Judicial','Gobierno y Administración','Gobierno abierto y Agenda 2030','Transparencia','Organización AGE','Comunidades autónomas','Administración local','Unión Europea'],
'II':['Atención al público','Documento, registro y archivo','Administración electrónica','Protección de datos y derechos digitales'],
'III':['Fuentes del Derecho administrativo','Acto administrativo','Procedimiento, revisión y recursos','Contratación pública','Actividad administrativa','Responsabilidad patrimonial','Igualdad y no discriminación'],
'IV':['Personal de las Administraciones','Selección de personal','Funcionarios de carrera e interinos','Adquisición, pérdida y situaciones administrativas','Provisión, derechos, carrera y promoción','Incompatibilidades y disciplina','MUFACE y clases pasivas','Personal laboral y convenio AGE','Seguridad Social personal laboral'],
'V':['Presupuesto y ciclo presupuestario','Presupuestos del Estado y modificaciones','Ejecución y control del gasto','Retribuciones y nóminas','Gastos y pagos','Contratos y subvenciones'],
'VI':['Informática básica y seguridad','Windows 11 y Copilot','Explorador de Windows','Word 365','Excel 365','Access 365','Outlook 365','Internet y navegadores'],
}
topics=[{'code':f'{b}-{i:02d}','block':b,'number':i,'title':v,'source':'https://www.boe.es/buscar/doc.php?id=BOE-A-2025-26262#anexo-iii'} for b,ls in syllabus.items() for i,v in enumerate(ls,1)]
assert len(topics)==45,len(topics)
ROOT.joinpath('data','questions.seed.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
ROOT.joinpath('data','cases.seed.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
ROOT.joinpath('data','syllabus-2025.json').write_text(json.dumps(topics,ensure_ascii=False,indent=2),encoding='utf-8')
from collections import Counter
stats=Counter(i['block'] for i in items)
print('Created',len(items),'questions',stats,'cases',len(cases),'topics',len(topics))
