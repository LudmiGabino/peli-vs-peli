USE competencias;
DROP TABLE IF EXISTS votacion;

CREATE TABLE votacion (
  id int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY(id)
);

ALTER TABLE votacion ADD COLUMN pelicula_id int(11);
ALTER TABLE votacion ADD FOREIGN KEY (pelicula_id) REFERENCES pelicula(id);

ALTER TABLE votacion ADD COLUMN competencia_id int(11);
ALTER TABLE votacion ADD FOREIGN KEY (competencia_id) REFERENCES competencia(id);