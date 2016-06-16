// Teatros

var teatrosQuery = "select ?nombre ?lat ?long where{?uri a om:Teatro. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.}"

// Cines

var cinesQuery = "select ?nombre ?lat ?long where{?uri a om:Cine. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.}"

// Monumentos

var monumentosQuery = "select ?nombre ?lat ?long ?enlacedbpedia where {?uri a om:Monumento. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.OPTIONAL  {?uri owl:sameAs ?enlacedbpedia. }}"

// Museos

var museosQuery = "select ?nombre ?lat ?long ?descripcion ?enlacedbpedia where {?uri a om:Museo. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.OPTIONAL  {?uri owl:sameAs ?enlacedbpedia. }OPTIONAL  {?uri schema:description ?descripcion. }}"

// PlazaMovilidadReducida

var movilidadQuery = "select ?uri ?lat ?long ?descripcion where {?uri a om:PlazaMovilidadReducida. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.OPTIONAL  {?uri rdfs:comment ?descripcion. }}"

// Bares restaurantes y cafes

var cafeRestauranteBarQuery = "select ?nombre ?lat ?long where {{?uri a om:BarCopas. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.} union{?uri a om:CafeBar. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.} union{?uri a om:Restaurante. ?uri rdfs:label ?nombre.?uri geo:lat ?lat.?uri geo:long ?long.}}"


function getDataCaceres(classData) {
    var endpoint = "http://opendata.caceres.es/sparql/";
    var graph = "";
    var SPARQLquery = "";
    switch (classData) {
    case "monument":
        SPARQLquery = monumentosQuery;
        break;
    case "museum":
        SPARQLquery = museosQuery;
        break;
    case "restaurant":
        SPARQLquery = cafeRestauranteBarQuery;
        break;
    case "parking":
        SPARQLquery = movilidadQuery;
        break;
    case "theatre":
        SPARQLquery = teatrosQuery;
        break;
    case "cinema":
        SPARQLquery = cinesQuery;
        break;
    default:
        break;
    }

    $.ajax({
        data: {
            "default-graph-uri": graph,
            query: SPARQLquery,
            format: 'json'
        },
        url: endpoint,
        cache: false,
        statusCode: {
            400: function (error) {
                alert("ERROR");
            }
        },
        success: function (data) {
            var headers = data.head.vars;
            var bindings = data.results.bindings;
            map.showPlacesMarkers(bindings, classData);
        }
    });
}