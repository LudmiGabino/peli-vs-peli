USE competencias;
DROP TABLE IF EXISTS competencia;

CREATE TABLE competencia (
  id int(11) NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  genero_id int(11) unsigned,
  director_id int(11) unsigned,
  actor_id int(11) unsigned,
  PRIMARY KEY (id),
  FOREIGN KEY (genero_id) REFERENCES genero (id),
  FOREIGN KEY (director_id) REFERENCES director (id),
  FOREIGN KEY (actor_id) REFERENCES actor (id)
);

LOCK TABLES competencia WRITE;
INSERT INTO competencia (id, nombre) VALUES (1, 'Cual es la mejor pelicula con Di Caprio?'), (2, 'Cual es la mejor pelicula?');
UNLOCK TABLES;