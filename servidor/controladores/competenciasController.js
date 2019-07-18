var con = require('../lib/conexionbd');

function buscarCompetencias(req, res) {

  var sqlCompetencia = 'SELECT * FROM competencia';
  console.log('obtenes todas las competencias.')

  con.query(sqlCompetencia, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(404).send('Hubo un error en la consulta');
    };
    res.send(JSON.stringify(resultado));
  })

};

function peliculasAleatorias(req, res) {
  var idCompetencia = req.params.id;

  var sql = 'SELECT * FROM competencia WHERE id = ' + idCompetencia;

  con.query(sql, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    }

    var nombre = resultado[0].nombre;
    var genero = resultado[0].genero_id;
    var director = resultado[0].director_id;
    var actor = resultado[0].actor_id;

    var sqlPelicula = "";

    if (genero != undefined && director == undefined && actor == undefined) {
      sqlPelicula = "SELECT * FROM pelicula WHERE genero_id = " + genero + " ORDER BY RAND() LIMIT 2;";
    } else if (genero == undefined && director != undefined && actor == undefined) {
      sqlPelicula = "SELECT p.id, p.titulo, p.poster FROM competencia c INNER JOIN director d ON d.id = c.director_id INNER JOIN director_pelicula dp ON dp.director_id = d.id INNER JOIN pelicula p ON p.id = dp.pelicula_id WHERE d.id = " + director + " ORDER BY RAND() LIMIT 2;";
    } else if (genero == undefined && director == undefined && actor != undefined) {
      sqlPelicula = "SELECT p.id, p.titulo, p.poster FROM competencia c INNER JOIN actor a ON a.id = c.actor_id INNER JOIN actor_pelicula ap ON ap.actor_id = a.id INNER JOIN pelicula p ON p.id = ap.pelicula_id WHERE a.id = " + actor + " ORDER BY RAND() LIMIT 2;";
    } else if (genero != undefined && director != undefined && actor == undefined) {
      sqlPelicula = "SELECT p.id, p.titulo, p.poster FROM competencia c INNER JOIN director d ON d.id = c.director_id INNER JOIN director_pelicula dp ON dp.director_id = d.id INNER JOIN genero g ON g.id = c.genero_id INNER JOIN pelicula p ON p.id = dp.pelicula_id  WHERE d.id = " + director + " AND g.id = " + genero + " ORDER BY RAND() LIMIT 2;";
    } else if (genero != undefined && director == undefined && actor != undefined) {
      sqlPelicula = "SELECT p.id, p.titulo, p.poster FROM competencia c INNER JOIN actor a ON a.id = c.actor_id INNER JOIN actor_pelicula ap ON ap.actor_id = a.id INNER JOIN genero g ON g.id = c.genero_id INNER JOIN pelicula p ON p.id = ap.pelicula_id WHERE c.genero_id = " + genero + " AND c.actor_id = " + actor + " ORDER BY RAND() LIMIT 2;";
    } else {
      sqlPelicula = "SELECT * FROM pelicula ORDER BY RAND() LIMIT 2;";
    }

    con.query(sqlPelicula, function (error, resultado, fields) {
      if (error) {
        console.log('Hubo un error en la consulta', error.message);
        return res.status(404).send('La competencia no existe');
      } else if (resultado.length == 0) {
        return res.status(404).json('No se encontraron peliculas');
      } else {
        var response = {
          'id': idCompetencia,
          'competencia': nombre,
          'peliculas': resultado
        };
        res.status(200).send(JSON.stringify(response));
        //res.send(JSON.stringify(response));
      }
    });
  });
};

function votarPelicula(req, res) {
  var idCompetencia = req.params.id;
  var idPelicula = req.body.idPelicula;

  con.query('INSERT INTO votacion (pelicula_id, competencia_id) values (?, ?)', [idPelicula, idCompetencia], function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    }
    res.json(resultado);
  })
};

function resultadoCompetencia(req, res) {
  var idCompetencia = req.params.id;

  var sqlResultado = "SELECT pelicula_id, COUNT(*) AS votos, p.titulo, p.poster FROM votacion v JOIN competencia c ON v.competencia_id = c.id JOIN pelicula p ON v.pelicula_id = p.id WHERE v.competencia_id = " + idCompetencia + " GROUP BY competencia_id, pelicula_id HAVING COUNT(*) >= 1 ORDER BY votos DESC LIMIT 3";

  con.query(sqlResultado, function (error, resultado) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    }
    if (resultado.length == 0) {
      return res.status(404).send("No existe el id");
    } else {
      var response = {
        'resultados': resultado
      };
      res.send(JSON.stringify(response));
    }
  });
};

function crearCompetencia(req, res) {
  var nombreCompetencia = req.body.nombre;
  var generoCompetencia = req.body.genero === '0' ? null : req.body.genero;
  var directorCompetencia = req.body.director === '0' ? null : req.body.director;
  var actorCompetencia = req.body.actor === '0' ? null : req.body.actor;

  if (!nombreCompetencia) {
    console.log("Debe completar el nombre de la competencia");
    return res.status(422).send("Debe completar el nombre de la competencia");
  }

  var sqlNombre = "SELECT * FROM competencia WHERE nombre ='" + nombreCompetencia + "'";

  con.query(sqlNombre, function (error, resultado, fields) {
    if (error) {
      console.log("Hubo un error en la consulta", error.message);
      return res.status(500).send("Hubo un error en la consulta");
    }
    if (resultado.length === 1) {
      console.log("Hubo un error en la consulta");
      return res.status(422).send("Ya existe una competencia con ese nombre.");
    }
        
    // -------> NOTA: cambié el count es de pelicula.id y no *, también cambie la consulta y las relaciones de las tablas se dan en  cada uno de los casos. 
    
        var sqlCant = "SELECT COUNT(p.id) AS cantidad FROM pelicula p ";
        
        var sqlJoin = "";
        
        var sqlWhere = "";

        if ((generoCompetencia) || (directorCompetencia) || (actorCompetencia)) {

          sqlWhere = " WHERE ";

          if (generoCompetencia) {
            sqlWhere = sqlWhere + " p.genero_id = " + generoCompetencia + " AND";
          }
          if (directorCompetencia) {
            sqlJoin = sqlJoin + " LEFT JOIN director_pelicula dp ON p.id = dp.pelicula_id ";
            sqlWhere = sqlWhere + " dp.director_id = " + directorCompetencia + " AND";
          }
          if (actorCompetencia) {
            sqlJoin = sqlJoin + " LEFT JOIN actor_pelicula ap ON P.id = ap.pelicula_id ";
            sqlWhere = sqlWhere + " ap.actor_id = " + actorCompetencia + " AND";
          }
          sqlWhere = sqlWhere.substr(0, sqlWhere.length - 3)
        }

        sqlCant = sqlCant + sqlJoin + sqlWhere
  
    /*
    
    -------> ERROR: PERMITIA CREAR UNA COMPETENCIA CON TAN SOLO UNA PELICULA <-------
    
    var sqlCant = "SELECT COUNT(*) AS cantidad FROM pelicula p LEFT JOIN director_pelicula dp ON p.id = dp.pelicula_id LEFT JOIN actor_pelicula ap ON P.id = ap.pelicula_id LEFT JOIN genero g ON p.genero_id = g.id";
    
    var sqlWhere = "";
    
    if ((generoCompetencia) || (directorCompetencia) || (actorCompetencia)) {

      sqlWhere = " WHERE ";

      if (generoCompetencia) {
        sqlWhere = sqlWhere + " p.genero_id = " + generoCompetencia + " AND";
      }
      if (directorCompetencia) {
        sqlWhere = sqlWhere + " dp.director_id = " + directorCompetencia + " AND";
      }
      if (actorCompetencia) {
        sqlWhere = sqlWhere + " ap.actor_id = " + actorCompetencia + " AND";
      }
      sqlWhere = sqlWhere.substr(0, sqlWhere.length - 3)
    }
    
    sqlCant = sqlCant + sqlWhere
*/

    con.query(sqlCant, function (error, resultado, fields) {
      if (error) {
        console.log("Hubo un error en la consulta", error.message);
        return res.status(500).send("Hubo un error en la consulta");
      }
      if (resultado.length === 0 || resultado[0].cantidad <= 1) {
        console.log("No exiten al menos 2 peliculas que cumplan los criterios");
        return res.status(422).send("No exiten al menos 2 peliculas que cumplan los criterios");
      }

      var sqlIns = "INSERT INTO competencia (nombre, genero_id, director_id, actor_id) VALUES ('" + nombreCompetencia + "'," + generoCompetencia + "," + directorCompetencia + "," + actorCompetencia + ")";

      con.query(sqlIns, function (error, resultado, fields) {
        if (error) {
          console.log("Hubo un error en la consulta", error.message);
          return res.status(500).send("Hubo un error en la consulta");
        }
        var response = {
          'nuevaCompetencia': resultado.nuevaComp
        };
        res.send(JSON.stringify(response));
      });
    });
  });
};

function eliminarVotos(req, res) {
  var idCompetencia = req.params.id;

  var sqlBuscarCompetencia = 'SELECT * FROM competencia WHERE id = ' + idCompetencia;

  con.query(sqlBuscarCompetencia, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(404).send('Hubo un error en la consulta');
    }
    if (resultado.length == 0) {
      return res.status(404).json('La competencia no existe');
    }

    var sqlEliminar = 'DELETE FROM votacion WHERE competencia_id = ' + idCompetencia;

    con.query(sqlEliminar, function (error, resultado, fields) {
      if (error) {
        console.log('Hubo un error en la consulta', error.message);
        return res.status(500).send('Hubo un error en la consulta');
      }
      res.status(200).send(JSON.stringify(resultado))
    });
  });
};

function obtenerGeneros(req, res) {
  var sqlGenero = 'SELECT * FROM genero';

  con.query(sqlGenero, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Error al cargar generos');
    }
    res.status(200).send(JSON.stringify(resultado))
  })
};

function obtenerDirectores(req, res) {
  var sqlDirector = 'SELECT * FROM director';

  con.query(sqlDirector, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta.', error.message);
      return res.status(500).send('Error al cargar directores');
    }
    res.status(200).send(JSON.stringify(resultado))
  })
};

function obtenerActores(req, res) {
  var sqlActores = 'SELECT * FROM actor';

  con.query(sqlActores, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta.', error.message);
      return res.status(500).send('Error al cargar actores');
    }
    res.status(200).send(JSON.stringify(resultado))
  })
};

function obtenerCompetencia(req, res) {
  var idCompetencia = req.params.id;

  var sql = "SELECT c.nombre, g.nombre AS generoCompetencia, d.nombre AS directorCompetencia, a.nombre AS actorCompetencia FROM competencia c LEFT JOIN genero g ON g.id = c.genero_id LEFT JOIN director d ON d.id = c.director_id LEFT JOIN actor a ON a.id = c.actor_id WHERE c.id = " + idCompetencia;

  con.query(sql, function (error, resultado, fields) {
    if (error) {
      console.log("Hubo un error en la consulta", error.message);
      return res.status(500).send("Hubo un error en la consulta");
    }
    if (resultado.length == 0) {
      return res.status(404).json('La competencia no existe');
    }
    var response = {
      'nombre': resultado[0].nombre,
      'genero_nombre': resultado[0].generoCompetencia,
      'actor_nombre': resultado[0].actorCompetencia,
      'director_nombre': resultado[0].directorCompetencia
    };

    res.send(JSON.stringify(response));
  });
};

function eliminarCompetencia(req, res) {
  var idCompetencia = req.params.id;
  console.log('Competencia para eliminar: ' + idCompetencia);

  var sqlBuscarCompetencia = "SELECT * FROM competencia WHERE id = " + idCompetencia;

  con.query(sqlBuscarCompetencia, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(404).send('Hubo un error en la consulta');
    }
    if (resultado.length == 0) {
      return res.status(404).json('La competencia no existe');
    }

    var sqlDelVot = "DELETE FROM votacion WHERE competencia_id = " + idCompetencia;

    con.query(sqlDelVot, function (error, resultado, fields) {
      if (error) {
        console.log('Hubo un error en la consulta', error.message);
        return res.status(404).send('Hubo un error en la consulta');
      }

      var sqlDelCom = "DELETE FROM competencia WHERE id = " + idCompetencia;

      con.query(sqlDelCom, function (error, resultado, fields) {
        if (error) {
          console.log('Hubo un error en la consulta', error.message);
          return res.status(404).send('Hubo un error en la consulta');
        }
        res.status(200).send(JSON.stringify(resultado))
      })
    })
  })
};

function editarCompetencia(req, res) {
  var idCompetencia = req.params.id;
  var nombreCompetencia = req.body.nombre;
  console.log('Competencia para editar: ' + idCompetencia);
  console.log('Competencia nombre: ' + nombreCompetencia);

  var competenciaAEditar = "SELECT * FROM competencia WHERE id = " + idCompetencia;

  con.query(competenciaAEditar, function (error, resultado, fields) {
    if (error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(404).send('Hubo un error en la consulta');
    }
    if (resultado.length == 0) {
      return res.status(404).json('La competencia no existe');
    }

    con.query('UPDATE competencia SET nombre = ? WHERE id = ?', [nombreCompetencia, idCompetencia], function (error, resultado, fields) {
      if (error) {
        console.log("Hubo un error en la consulta", error.message);
        return res.status(500).send("Hubo un error en la consulta");
      }
      res.status(200).send(JSON.stringify(resultado))
    })
  })
}

module.exports = {
  buscarCompetencias: buscarCompetencias,
  peliculasAleatorias: peliculasAleatorias,
  votarPelicula: votarPelicula,
  resultadoCompetencia: resultadoCompetencia,
  crearCompetencia: crearCompetencia,
  eliminarVotos: eliminarVotos,
  obtenerGeneros: obtenerGeneros,
  obtenerDirectores: obtenerDirectores,
  obtenerActores: obtenerActores,
  obtenerCompetencia: obtenerCompetencia,
  eliminarCompetencia: eliminarCompetencia,
  editarCompetencia: editarCompetencia
}
