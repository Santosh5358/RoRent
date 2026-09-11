package com.roomrent.config;

import com.roomrent.service.SequenceGeneratorService;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;

/**
 * Assigns a sequential numeric id to any {@code com.roomrent.model} document that
 * has a {@code Long id} field left null before it is first persisted. This lets
 * the domain keep SQL-style numeric ids after the migration to MongoDB.
 */
@Component
public class MongoIdListener extends AbstractMongoEventListener<Object> {

    private final SequenceGeneratorService sequenceGenerator;

    public MongoIdListener(SequenceGeneratorService sequenceGenerator) {
        this.sequenceGenerator = sequenceGenerator;
    }

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Object> event) {
        Object source = event.getSource();
        if (source == null || !source.getClass().getPackageName().equals("com.roomrent.model")) {
            return;
        }
        try {
            Field idField = source.getClass().getDeclaredField("id");
            if (!Long.class.equals(idField.getType())) {
                return;
            }
            idField.setAccessible(true);
            if (idField.get(source) == null) {
                idField.set(source, sequenceGenerator.generateSequence(event.getCollectionName() + "_seq"));
            }
        } catch (NoSuchFieldException ignored) {
            // Documents without a Long id field (e.g. the sequence counter) are skipped.
        } catch (IllegalAccessException ignored) {
            // Should not happen; field is made accessible above.
        }
    }
}
